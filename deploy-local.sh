#!/bin/bash
# If Bash reports "set: Illegal option", convert Windows line endings and rerun:
# sudo apt-get update && sudo apt-get install dos2unix -y
# dos2unix deploy-local.sh
# bash deploy-local.sh
set -euo pipefail

echo "=== 배포 전 필수 도구 및 파일 확인 ==="
for command in docker kubectl kind helm; do
    command -v "$command" >/dev/null 2>&1 || { echo "❌ $command가 설치되어 있지 않습니다."; exit 1; }
done
helm upgrade --help | grep -q -- '--take-ownership' || { echo "❌ 기존 Kubernetes 리소스 인계를 위해 Helm 3.17 이상이 필요합니다."; exit 1; }
for file in k8s/charts/canieat/Chart.yaml k8s/charts/canieat/files/nginx.conf; do
    [ -f "$file" ] || { echo "❌ $file 파일이 없습니다."; exit 1; }
done
[ -f "k8s/secrets.yaml" ] || { echo "❌ k8s/secrets.yaml 파일이 없습니다. secrets-example.yaml을 참고하여 생성해주세요."; exit 1; }

echo "=== [1/5] Docker 및 kind 클러스터 확인 ==="
docker version >/dev/null 2>&1 || { echo "❌ Docker가 실행 중이거나 현재 사용자에게 권한이 없습니다."; exit 1; }
if ! kind get clusters | grep -Fx "canieat" >/dev/null; then
    echo "❌ kind 클러스터 'canieat'이 없습니다. 먼저 deploy.sh를 실행해주세요."
    exit 1
fi
kubectl config use-context kind-canieat
kubectl get nodes || { echo "❌ kind-canieat 클러스터 노드에 접근할 수 없습니다."; exit 1; }

echo "=== [2/5] 로컬 레지스트리(canieat-registry) 확인 및 설정 ==="
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

docker network inspect kind >/dev/null || { echo "❌ kind Docker 네트워크를 찾을 수 없습니다."; exit 1; }
if ! docker network inspect kind --format '{{range .Containers}}{{.Name}}{{"\n"}}{{end}}' | grep -Fx "canieat-registry" >/dev/null; then
    docker network connect kind canieat-registry
fi

echo "=== [3/5] 도커 이미지 빌드 및 레지스트리 푸시 ==="
docker build -t localhost:5001/canieat-db:dev ./db
docker build -t localhost:5001/canieat-backend:dev ./backend
docker build -t localhost:5001/canieat-frontend:prod ./frontend

docker push localhost:5001/canieat-db:dev
docker push localhost:5001/canieat-backend:dev
docker push localhost:5001/canieat-frontend:prod

echo "=== [4/5] Kubernetes Secret 설정 ==="
kubectl apply -f k8s/secrets.yaml

echo "=== [5/5] Helm으로 애플리케이션(DB, FastAPI, Frontend) 배포 ==="
helm upgrade --install canieat k8s/charts/canieat --take-ownership

echo "롤아웃 상태 확인 중..."
kubectl rollout status deployment/postgres --timeout=120s
kubectl rollout status deployment/fastapi --timeout=120s
kubectl rollout status deployment/frontend --timeout=120s

echo "🎉 로컬 배포가 완료되었습니다!"
echo ""
echo "💡 브라우저에서 접속하려면 새 터미널을 열고 다음 명령어를 실행하세요:"
echo "   kubectl port-forward service/frontend 8081:80"
echo "   그 후 브라우저에서 http://localhost:8081 로 접속합니다."
kubectl get pods,services