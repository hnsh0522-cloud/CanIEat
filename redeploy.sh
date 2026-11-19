#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

# 1. 인자값 확인 (입력하지 않았거나 잘못 입력했을 경우 가이드 제공)
TARGET="${1:-all}"

case "$TARGET" in
  db|backend|frontend|all)
    echo "🎯 배포 타겟: [ $TARGET ]"
    ;;
  *)
    echo "❌ 잘못된 인자입니다. 사용법:"
    echo "  ./redeploy.sh db       - 데이터베이스만 재배포"
    echo "  ./redeploy.sh backend  - 백엔드만 재배포"
    echo "  ./redeploy.sh frontend - 프론트엔드만 재배포"
    echo "  ./redeploy.sh all      - 전체 재배포 (기본값)"
    exit 1
    ;;
esac

echo "=== Kubernetes 및 Docker 연결 확인 ==="
docker version >/dev/null 2>&1 || { echo "❌ Docker가 실행 중이거나 연결되어 있지 않습니다."; exit 1; }
kubectl config current-context || { echo "❌ 활성화된 Kubernetes 컨텍스트가 없습니다."; exit 1; }
kubectl get nodes || { echo "❌ Kubernetes 클러스터에 접근할 수 없습니다."; exit 1; }

# 설정 파일 체크는 전체 혹은 각 컴포넌트 빌드 시 공통으로 필요하므로 유지
if [ ! -f "k8s/secrets.yaml" ]; then
    echo "❌ k8s/secrets.yaml 파일이 없습니다. secrets-example.yaml을 참고하여 생성해주세요."
    exit 1
fi

if [ ! -f "k8s/cluster-issuer.yaml" ]; then
    echo "❌ k8s/cluster-issuer.yaml 파일이 없습니다. cluster-issuer-example.yaml을 참고하여 생성해주세요."
    exit 1
fi

echo "=== 로컬 레지스트리 확인 ==="
if [ -z "$(docker ps -q -f name=canieat-registry)" ]; then
    if [ -n "$(docker ps -aq -f status=exited -f name=canieat-registry)" ]; then
        docker start canieat-registry
    else
        docker run -d \
          --name canieat-registry \
          --restart always \
          -p 0.0.0.0:5001:5000 \
          -v canieat-registry-data:/var/lib/registry \
          registry:2
    fi
fi

docker network connect kind canieat-registry 2>/dev/null || true

echo "=== 이미지 빌드 및 레지스트리 push ==="
# 선택된 타겟에 맞춰서만 빌드 및 푸시 수행
if [ "$TARGET" = "all" ] || [ "$TARGET" = "db" ]; then
    echo "📦 [DB] 빌드 및 푸시 중..."
    docker build -t localhost:5001/canieat-db:dev ./db
    docker push localhost:5001/canieat-db:dev
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
    echo "📦 [Backend] 빌드 및 푸시 중..."
    docker build -t localhost:5001/canieat-backend:dev ./backend
    docker push localhost:5001/canieat-backend:dev
fi

if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
    echo "📦 [Frontend] 빌드 및 푸시 중..."
    docker build -t localhost:5001/canieat-frontend:prod ./frontend
    docker push localhost:5001/canieat-frontend:prod
fi

echo "=== Kubernetes 설정 및 앱 매니페스트 적용 ==="
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/cluster-issuer.yaml

# 프론트엔드가 포함될 때만 configmap 재생성 (선택사항이지만 효율적)
if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
    kubectl create configmap frontend-nginx-config \
      --from-file=default.conf=frontend/nginx.conf \
      --dry-run=client -o yaml | kubectl apply -f -
fi

kubectl apply -f k8s/app.yaml

echo "=== 앱 Deployment 순차 재시작 및 상태 확인 ==="
# 선택된 대상에 따라 필요한 디플로이먼트만 재시작
for deployment in postgres fastapi frontend; do
    # 타겟이 특정 컴포넌트일 경우, 다른 컴포넌트는 건너뜀
    if [ "$TARGET" != "all" ]; then
        if [ "$TARGET" = "db" ] && [ "$deployment" != "postgres" ]; then continue; fi
        if [ "$TARGET" = "backend" ] && [ "$deployment" != "fastapi" ]; then continue; fi
        if [ "$TARGET" = "frontend" ] && [ "$deployment" != "frontend" ]; then continue; fi
    fi

    echo "🔄 [$deployment] 재시작 중..."
    kubectl rollout restart "deployment/$deployment"
    kubectl rollout status "deployment/$deployment" --timeout=120s
done

echo "🎉 재배포가 완료되었습니다!"
kubectl get pods,ingress,certificate