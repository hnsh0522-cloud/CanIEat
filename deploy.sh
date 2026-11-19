#!/bin/bash
# If Bash reports "set: Illegal option", convert Windows line endings and rerun:
# sudo apt-get update && sudo apt-get install dos2unix -y
# dos2unix deploy.sh
# bash deploy.sh
set -euo pipefail

echo "=== 배포 전 필수 도구 및 파일 확인 ==="
for command in docker kubectl kind helm; do
    command -v "$command" >/dev/null 2>&1 || { echo "❌ $command가 설치되어 있지 않습니다."; exit 1; }
done
helm upgrade --help | grep -q -- '--take-ownership' || { echo "❌ 기존 Kubernetes 리소스 인계를 위해 Helm 3.17 이상이 필요합니다."; exit 1; }
[ -f "k8s/kind-config.yaml" ] || { echo "❌ k8s/kind-config.yaml 파일이 없습니다."; exit 1; }
[ -f "k8s/secrets.yaml" ] || { echo "❌ k8s/secrets.yaml 파일이 없습니다. secrets-example.yaml을 참고하여 생성해주세요."; exit 1; }

echo "=== [1/7] 환경 및 도커 연결 확인 ==="
docker version >/dev/null 2>&1 || { echo "❌ Docker가 실행 중이거나 WSL과 연결되어 있지 않습니다."; exit 1; }
kubectl version --client >/dev/null 2>&1 || { echo "❌ kubectl이 설치되어 있지 않습니다."; exit 1; }

echo "=== [2/7] 로컬 레지스트리(canieat-registry) 설정 ==="
if [ ! "$(docker ps -q -f name=canieat-registry)" ]; then
    if [ "$(docker ps -aq -f name=canieat-registry)" ]; then
        echo "중지된 레지스트리 컨테이너를 시작합니다..."
        docker start canieat-registry
    else
        echo "새 로컬 레지스트리 컨테이너를 생성합니다..."
        docker run -d \
          --name canieat-registry \
          --restart always \
          -p 0.0.0.0:5001:5000 \
          -v canieat-registry-data:/var/lib/registry \
          registry:2
    fi
fi

echo "=== [3/7] kind 클러스터 생성 (기존에 없으면 생성) ==="
if kind get clusters | grep -qx "canieat"; then
    echo "기존 'canieat' 클러스터를 사용합니다."
else
    echo "새 kind 클러스터를 생성합니다..."
    kind create cluster --name canieat --config k8s/kind-config.yaml
fi

# kind 네트워크에 레지스트리 연결 (이미 연결된 경우에는 생략)
if ! docker network inspect kind --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}' | grep -Fxq "canieat-registry"; then
    docker network connect kind canieat-registry
fi

kubectl config use-context kind-canieat

# containerd 레지스트리 패치 (노드 내부에서 로컬 레지스트리 인식을 위함)
docker exec canieat-control-plane mkdir -p /etc/containerd/certs.d/localhost:5001
cat <<'EOF' | docker exec -i canieat-control-plane tee /etc/containerd/certs.d/localhost:5001/hosts.toml
[host."http://canieat-registry:5000"]
  capabilities = ["pull", "resolve"]
EOF

echo "=== [4/7] 도커 이미지 빌드 및 레지스트리 푸시 ==="
docker build -t localhost:5001/canieat-db:dev ./db
docker build -t localhost:5001/canieat-backend:dev ./backend
docker build -t localhost:5001/canieat-frontend:prod ./frontend

docker push localhost:5001/canieat-db:dev
docker push localhost:5001/canieat-backend:dev
docker push localhost:5001/canieat-frontend:prod

echo "=== [5/7] Kubernetes Secret 설정 ==="
kubectl apply -f k8s/secrets.yaml

echo "=== [6/7] Ingress Controller 및 Cert-Manager 배포 ==="
kubectl label node canieat-worker ingress-ready=true --overwrite
kubectl apply -f k8s/nginx-ingress-controller.yaml
kubectl apply -f k8s/cert-manager.yaml

echo "Ingress-nginx 및 Cert-manager가 준비될 때까지 대기 중..."
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=90s
kubectl wait --namespace cert-manager --for=condition=Available deployment --all --timeout=120s

if [ ! -f "k8s/cluster-issuer.yaml" ]; then
    echo "❌ k8s/cluster-issuer.yaml 파일이 없습니다. cluster-issuer-example.yaml을 참고하여 생성해주세요."
    exit 1
fi
kubectl apply -f k8s/cluster-issuer.yaml

echo "=== [7/7] Helm으로 애플리케이션(DB, FastAPI, Frontend) 배포 ==="
helm upgrade --install canieat k8s/charts/canieat --take-ownership

echo "롤아웃 상태 확인 중..."
kubectl rollout status deployment/postgres --timeout=120s
kubectl rollout status deployment/fastapi --timeout=120s
kubectl rollout status deployment/frontend --timeout=120s

echo "🎉 모든 배포가 성공적으로 완료되었습니다!"
kubectl get pods,ingress,certificate