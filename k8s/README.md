# CanIEat Kubernetes 배포 (WSL 2 + Docker Desktop kind)

이 문서는 Windows의 Docker Desktop에서 WSL Ubuntu를 사용해 포트 매핑이 설정된 새 kind 클러스터를 만들고 CanIEat을 배포하는 방법을 정리합니다. WSL에서 `kind`, `kubectl` 명령을 사용할 수 있어야 하며, Docker가 실행 중이고 Ubuntu에서 Docker Desktop 엔진에 연결되어 있어야 합니다.

> **로컬에서만 접속하려는 경우:** 새 kind 클러스터를 만들 필요가 없으며, 따라서 kind 설치 과정도 건너뛸 수 있습니다. 이미 사용할 수 있는 Kubernetes 클러스터가 있다면 `kubectl config current-context`와 `kubectl get nodes`로 연결을 확인하고, 그 클러스터에 애플리케이션을 배포한 뒤 `kubectl port-forward service/frontend 8081:80`으로 접속하세요. 브라우저에서는 `http://localhost:8081`을 엽니다. 단, Kubernetes 클러스터 자체는 필요하며, 앱이 아직 배포되지 않았다면 이 문서의 이미지 준비와 Secret/ConfigMap, 앱 배포 절차는 진행해야 합니다. 로컬 포트 포워딩은 공개 도메인 접속이나 HTTPS를 설정하지 않습니다.

## 구성 요약

- PostgreSQL: `postgres` Deployment/ClusterIP Service, PVC에 데이터 저장
- FastAPI: `fastapi` Deployment/ClusterIP Service
- 프런트엔드: Nginx 정적 파일 서버 및 `/api/` 요청의 FastAPI 프록시
- 외부 접속: NGINX Ingress Controller를 통해 `canieat.kro.kr`로 연결
- HTTPS: cert-manager와 Let's Encrypt가 TLS 인증서를 자동 발급/갱신
- 이미지 레지스트리: 아래 예시는 `localhost:5001`을 사용합니다. 현재 `app.yaml`의 이미지 이름과 일치해야 합니다.

## 1. kind 설치 및 클러스터 생성

### 1.1. WSL Ubuntu에 kind 설치

Docker Desktop을 실행하고 Docker Desktop 설정에서 Ubuntu 배포판의 WSL Integration을 활성화합니다. Ubuntu 터미널에서 Docker가 연결되는지 확인합니다.

```bash
docker version
```

`kind`는 공식 Linux 바이너리로 설치할 수 있습니다. 다음 명령은 Ubuntu의 CPU 아키텍처에 맞는 실행 파일을 내려받아 `/usr/local/bin/kind`에 설치합니다.

```bash
ARCH=$(uname -m)
case "$ARCH" in
  x86_64) KIND_ARCH=amd64 ;;
  aarch64|arm64) KIND_ARCH=arm64 ;;
  *) echo "지원하지 않는 아키텍처: $ARCH"; exit 1 ;;
esac

curl -Lo /tmp/kind "https://kind.sigs.k8s.io/dl/v0.33.0/kind-linux-${KIND_ARCH}"
chmod +x /tmp/kind
sudo install -o root -g root -m 0755 /tmp/kind /usr/local/bin/kind
rm /tmp/kind
kind version
```

위 예시는 kind `v0.33.0`을 설치합니다. 다른 버전을 사용하려면 다운로드 URL의 버전도 함께 변경하세요. `kubectl`도 설치되어 있어야 합니다. Docker Desktop의 WSL Integration이 꺼져 있거나 Docker 엔진이 실행되지 않으면 kind 클러스터를 만들 수 없습니다.

>**아래의 과정을 거치기 귀찮다면:** 만약 kind 설치까지 정상적으로 다 되어 있다면 아래의 과정을 거치지 않고 deploy-local.sh 혹은 deploy.sh 파일을 실행해서 배포를 한 번에 할 수 있습니다. deploy-local.sh은 로컬 전용 접속 배포이고 deploy.sh는 도메인 접속 배포입니다. 파일 실행 권한 부여 후 파일을 실행하면 됩니다.

### 1.2. 새 kind 클러스터 생성

저장소 루트로 이동합니다. WSL에서 Windows의 저장소를 사용한다면 경로는 보통 다음과 같습니다. `kubectl`과 Docker 연결도 확인합니다.

```bash
cd /mnt/c/Users/USER/CanIEat
kubectl version --client
docker version
kind get clusters
```

`k8s/kind-config.yaml`은 첫 번째 worker 노드(`canieat-worker`)에 `ingress-ready=true` 라벨을 지정하고, 그 노드의 80/443 포트를 호스트의 18080/18443 포트에 매핑합니다. `k8s/nginx-ingress-controller.yaml`의 Ingress Controller Deployment는 이 라벨을 가진 노드만 선택하므로 컨트롤러 Pod는 해당 worker 하나에 고정되고 다른 worker나 control-plane에는 스케줄되지 않습니다. Kubernetes 내부의 Ingress 포트는 계속 80/443이며, 바뀌는 것은 호스트에서 접속할 포트입니다. 호스트의 18080/18443 포트가 사용 가능해야 합니다. 이 설정은 클러스터 생성 시 적용되므로 기존 클러스터에는 자동 적용되지 않습니다. 아래 명령은 `canieat`이라는 새 클러스터를 생성합니다.

```bash
kind create cluster --name canieat --config k8s/kind-config.yaml
kubectl config use-context kind-canieat
kubectl config current-context
kubectl get nodes
```

`kubectl get nodes`에서 노드가 `Ready`인지 확인합니다. `kind get clusters`에 `canieat`이 이미 있으면 생성 명령이 실패하므로, 기존 클러스터를 삭제하지 말고 다른 이름을 선택한 뒤 `--name`과 이후 컨텍스트/노드 이름을 그에 맞게 바꿉니다. 기존 클러스터를 새 클러스터로 교체할 경우 기존 PVC에 저장된 데이터는 새 클러스터로 자동 이전되지 않으므로 필요한 데이터는 먼저 백업합니다.

외부 인터넷에서 기본 주소인 `https://canieat.kro.kr`로 접속하려면 공인 IP와 DNS 외에도 라우터/방화벽에서 외부 TCP 80을 호스트 18080으로, 외부 TCP 443을 호스트 18443으로 전달해야 합니다. Windows 방화벽에서도 해당 트래픽을 허용해야 합니다. 이 포트 전달은 Let's Encrypt HTTP-01 인증 검증에도 필요하므로 외부 80 포트가 열려 있어야 합니다.

새 클러스터를 준비한 뒤에는 아래 2~8단계를 순서대로 진행합니다. 이후의 모든 `kubectl` 명령이 방금 만든 `kind-canieat` 컨텍스트를 대상으로 하는지 확인하세요.

## 2. 로컬 레지스트리 생성 및 확인

이 저장소의 현재 매니페스트는 다음 이미지를 참조합니다.

```text
localhost:5001/canieat-db:dev
localhost:5001/canieat-backend:dev
localhost:5001/canieat-frontend:prod
```

레지스트리가 아직 없다면 Ubuntu에서 Docker가 연결된 Docker Desktop 엔진에 다음 컨테이너를 한 번 생성합니다. 데이터는 Docker 볼륨에 보관됩니다. `-p 5001:5000`은 호스트의 모든 네트워크 인터페이스에 포트를 공개하므로, 이 로컬 개발용 레지스트리를 인터넷에 노출하지 마세요. 호스트 방화벽에서 외부 접근을 차단하고 신뢰할 수 있는 네트워크에서만 사용합니다.

```bash
docker run -d \
  --name canieat-registry \
  --restart always \
  -p 0.0.0.0:5001:5000 \
  -v canieat-registry-data:/var/lib/registry \
  registry:2
```

이미 `canieat-registry` 컨테이너가 있으면 다시 만들지 말고 아래 확인 명령을 사용합니다. 중지된 기존 컨테이너를 다시 시작하려면 `docker start canieat-registry`를 실행합니다.

```bash
docker ps --filter name=canieat-registry
docker port canieat-registry
curl http://localhost:5001/v2/
```

`curl`이 `{}`를 반환하면 레지스트리가 응답하는 것입니다. 호스트 포트 `5001`은 레지스트리 컨테이너의 `5000` 포트로 연결됩니다. 따라서 Docker 네트워크 안에서 컨테이너 이름으로 접속할 때는 `canieat-registry:5000`을 사용합니다. 빌드 태그와 `k8s/app.yaml`의 이미지 주소는 호스트에서 push/pull하는 주소인 `localhost:5001`을 유지합니다.

kind 노드 컨테이너가 레지스트리에 접근할 수 있도록 레지스트리를 `kind` Docker 네트워크에 연결합니다. `docker network connect`를 이미 실행했다면 다시 실행할 필요는 없습니다.

```bash
docker network connect kind canieat-registry
docker network inspect kind
```

kind 설정의 `containerdConfigPatches`는 이미지 주소 `localhost:5001`의 요청을 Docker 네트워크 내부의 `http://canieat-registry:5000`으로 보내도록 합니다. 기존 클러스터를 사용 중이어서 이 설정이 클러스터 생성 시 반영되지 않았다면, 컨트롤 플레인 노드의 containerd 레지스트리 설정을 추가합니다. 클러스터 이름이 `canieat`이면 노드 컨테이너 이름은 `canieat-control-plane`입니다. 다른 이름으로 만들었다면 컨테이너 이름도 그에 맞게 바꿉니다.

```bash
docker exec canieat-control-plane mkdir -p /etc/containerd/certs.d/localhost:5001

cat <<'EOF' | docker exec -i canieat-control-plane tee /etc/containerd/certs.d/localhost:5001/hosts.toml
[host."http://canieat-registry:5000"]
  capabilities = ["pull", "resolve"]
EOF
```

이 설정은 containerd가 `localhost:5001` 이미지 요청에 사용할 레지스트리 endpoint를 지정합니다. registry 컨테이너의 내부 포트는 `5000`이므로 `hosts.toml`에도 `canieat-registry:5000`을 사용합니다. 레지스트리가 응답하고 네트워크에 연결된 뒤 이미지를 빌드/push하세요. Pull 실패 시 다음을 확인합니다.

```bash
kubectl describe pods
kubectl get events --sort-by=.metadata.creationTimestamp
docker network inspect kind
```

`ImagePullBackOff` 또는 `ErrImagePull`이면 레지스트리 컨테이너가 실행 중인지, `kind` 네트워크에 연결되어 있는지, 노드의 `hosts.toml` 경로와 내부 endpoint 포트가 맞는지, 이미지 태그가 존재하는지 확인합니다.

## 3. 이미지 빌드와 push

저장소 루트에서 각 Dockerfile을 빌드하고 레지스트리에 push합니다.
이미지를 빌드하고 파일을 수정했다면 다시 이미지를 빌드한 뒤 로컬 레지스트리에 push 하면 됩니다.

```bash
docker build -t localhost:5001/canieat-db:dev ./db
docker build -t localhost:5001/canieat-backend:dev ./backend
docker build -t localhost:5001/canieat-frontend:prod ./frontend

docker push localhost:5001/canieat-db:dev
docker push localhost:5001/canieat-backend:dev
docker push localhost:5001/canieat-frontend:prod
```

## 4. Kubernetes Secret 준비

매니페스트는 `canieat-secrets` Secret에서 DB 사용자/비밀번호/DB 이름, `DATABASE_URL`, `JWT_SECRET_KEY`, `OPENROUTER_API_KEY`를 읽습니다. 실제 값을 넣은 `k8s/secrets.yaml`을 준비한 뒤 적용합니다.

```bash
kubectl apply -f k8s/secrets.yaml
```

`secrets-example.yaml`은 예시일 뿐이므로 placeholder 값을 그대로 배포하지 마세요. 실제 비밀 값이 들어간 `secrets.yaml`은 Git에 커밋하거나 공유하지 않습니다. 이미 저장소에 노출된 비밀번호나 API 키가 있다면 안전한 값으로 교체/회전하고 Secret을 다시 적용하세요.

## 5. 프런트엔드 Nginx ConfigMap 준비

`app.yaml`은 프런트엔드 컨테이너의 `/etc/nginx/conf.d/default.conf`를 `frontend-nginx-config` ConfigMap에서 마운트합니다. 먼저 현재 프런트엔드 Nginx 설정으로 ConfigMap을 생성하거나 갱신합니다.

```bash
kubectl create configmap frontend-nginx-config \
  --from-file=default.conf=frontend/nginx.conf \
  --dry-run=client -o yaml | kubectl apply -f -
```

Ingress와 프런트엔드 Nginx의 요청 본문 크기 제한은 12MB이며, 식품 사진 API는 10MB까지 받습니다. 두 프록시 설정 중 하나라도 갱신되지 않으면 큰 사진 업로드가 `413 Request Entity Too Large`로 거부될 수 있습니다. 변경을 배포할 때는 Ingress 매니페스트와 ConfigMap을 모두 적용하고 프런트엔드 Pod를 재시작합니다.

```bash
kubectl apply -f k8s/app.yaml
kubectl create configmap frontend-nginx-config \
  --from-file=default.conf=frontend/nginx.conf \
  --dry-run=client -o yaml | kubectl apply -f -
kubectl rollout restart deployment/frontend
```

프런트엔드 API 요청 경로는 FastAPI 라우트와 끝 슬래시까지 일치시켜야 불필요한 307 리다이렉트를 피할 수 있습니다. 설정 파일이나 ConfigMap 내용을 바꾼 뒤에는 `subPath` 마운트가 새 파일을 자동 반영하지 않으므로 프런트엔드 Pod를 재시작합니다.

## 6. 도메인과 HTTPS 준비

### 6.1. NGINX Ingress Controller 설치

저장소에 포함된 Ingress Controller manifest를 적용합니다. 이 파일은 `ingress-ready=true` 라벨이 있는 worker 노드에 컨트롤러 Pod를 배치하도록 설정되어 있습니다. 새 클러스터는 `k8s/kind-config.yaml`에서 첫 번째 worker에 해당 라벨을 지정합니다.

기존 클러스터에서는 Ingress Controller를 적용하기 전에 대상 worker에 라벨을 지정합니다. 다른 노드(예: 이전 설정의 control-plane)에 같은 라벨이 남아 있으면 해당 노드에서는 라벨을 제거해 대상 worker 하나에만 라벨이 있도록 합니다.

```bash
kubectl get nodes -L ingress-ready
kubectl label node canieat-worker ingress-ready=true --overwrite
```

이전 설정으로 control-plane 등 다른 노드에도 `ingress-ready=true`가 지정되어 있다면 해당 노드의 라벨을 제거합니다. 예를 들어 control-plane에 라벨이 남아 있는 경우 다음 명령을 실행합니다.

```bash
kubectl label node canieat-control-plane ingress-ready-
```

그다음 로컬 manifest를 적용합니다.

```bash
kubectl apply -f k8s/nginx-ingress-controller.yaml
```

컨트롤러 Pod가 준비될 때까지 대기하고 상태를 확인합니다.

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=90s

kubectl get pods -n ingress-nginx -o wide
```

컨트롤러 Pod가 `Running` 및 `Ready` 상태이고 `NODE` 열이 지정한 worker인지 확인합니다. 새 kind 클러스터에서 포트 매핑은 해당 worker에 설정되어 있습니다.

### 6.2. cert-manager 설치

저장소에 포함된 cert-manager manifest를 적용합니다.

```bash
kubectl apply -f k8s/cert-manager.yaml
```

cert-manager의 세 Deployment가 Ready 상태가 될 때까지 기다린 뒤 확인합니다.

```bash
kubectl wait --namespace cert-manager \
  --for=condition=Available deployment \
  --all \
  --timeout=120s

kubectl get pods -n cert-manager
kubectl get deployments -n cert-manager
```

`cert-manager`, `cert-manager-cainjector`, `cert-manager-webhook` Pod가 `Running`이고 각 Deployment의 READY가 `1/1`인지 확인합니다.

### 6.3. 도메인과 인증서 발급 준비

이 저장소의 ClusterIssuer를 적용하기 전에 `k8s/cluster-issuer.yaml`의 `email`을 인증서 만료 알림을 받을 실제 이메일 주소로 수정합니다. cert-manager가 준비된 다음 ClusterIssuer를 생성하고 `Ready=True`인지 확인합니다.

```bash
kubectl apply -f k8s/cluster-issuer.yaml
kubectl get clusterissuer letsencrypt-prod
```

`Ready=True`가 아니면 cert-manager 로그와 ClusterIssuer 상태를 확인합니다.

도메인 DNS에서 `canieat.kro.kr`이 라우터/서버의 공개 IP를 가리키도록 A 레코드(또는 제공 환경에 맞는 레코드)를 설정합니다. DNS 전파 후 외부 TCP 80은 호스트 18080으로, 외부 TCP 443은 호스트 18443으로 전달되어야 합니다. Let's Encrypt HTTP-01 검증은 외부 TCP 80으로 들어오므로 인증서 발급 중에도 이 포트 전달이 동작해야 합니다. 라우터에서 80 포트를 전달할 수 없거나 ISP가 차단하면 HTTP-01 검증이 실패할 수 있습니다.

이 저장소의 Docker Desktop kind 클러스터는 기본 설정만으로 인터넷에서 접근할 수 없습니다. 도메인을 공개하려면 공인 IP를 가진 서버/로드밸런서와 클러스터 Ingress Controller가 연결되어 있어야 합니다.

`Ready=True`가 아니거나 인증서 발급이 진행되지 않으면 cert-manager 로그, DNS 전파, Ingress 설정 및 80 포트 연결을 점검합니다.

#### HTTP-01 self-check에서 DNS 조회가 실패하는 경우 (app.yaml 먼저 배포 해야 함)

공개 DNS와 외부 접속은 올바른데 cert-manager의 Challenge 상태에 `Waiting for http-01 challenge propagation` 또는 도메인 조회 오류가 계속 표시되는 경우, 클러스터 내부 DNS가 도메인을 공개 IP로 해석한 뒤 외부로 되돌아오는 연결(NAT loopback)을 하지 못하는 환경인지 확인합니다. 이때 CoreDNS에 `canieat.kro.kr`을 Ingress Controller Service의 ClusterIP로 해석하도록 추가하면 클러스터 내부 self-check에 도움이 될 수 있습니다.

먼저 Ingress Controller Service의 실제 ClusterIP를 확인합니다.

```bash
kubectl get service ingress-nginx-controller -n ingress-nginx
```

CoreDNS ConfigMap을 편집합니다.

```bash
kubectl edit configmap coredns -n kube-system
```

`data.Corefile`의 기존 `.:53 { ... }` 블록 안에 `hosts` 플러그인 블록을 추가합니다. ConfigMap 전체를 아래 예시로 교체하지 마세요. `<INGRESS_CLUSTER_IP>`는 앞에서 확인한 ClusterIP로 바꾸고, 기존 Corefile의 나머지 설정과 들여쓰기는 유지합니다. 예를 들어 `loadbalance`가 있다면 그 뒤, 바깥 `.:53` 블록의 닫는 중괄호 앞에 추가합니다.

```text
        hosts {
           <INGRESS_CLUSTER_IP> canieat.kro.kr
           fallthrough
        }
```

저장 후 CoreDNS가 설정을 다시 읽도록 재시작하고 상태를 확인합니다.

```bash
kubectl rollout restart deployment coredns -n kube-system
kubectl rollout status deployment coredns -n kube-system
kubectl get pods -n kube-system -l k8s-app=kube-dns
```

적용 후 인증서와 Challenge 상태를 확인합니다. 설정 오류가 있거나 발급이 계속 대기 중이면 해당 Challenge의 상세 상태와 이벤트를 확인합니다.

```bash
kubectl get certificate canieat-kro-kr-tls
kubectl get challenges -A
kubectl describe challenge -n NAMESPACE CHALLENGE_NAME
```

`NAMESPACE`와 `CHALLENGE_NAME`은 앞 명령에서 확인한 실제 값으로 바꿉니다.

전체 네임스페이스의 Challenge를 일괄 삭제하지 마세요. 다른 인증서 발급에 영향을 줄 수 있고, Challenge는 cert-manager가 관리하는 리소스입니다. CoreDNS의 hosts 항목은 클러스터 내부의 DNS 응답만 바꿉니다. Let's Encrypt가 인터넷에서 수행하는 검증을 대신하지 않으므로, 공개 DNS가 공인 IP를 가리키고 외부 TCP 80이 호스트 18080을 거쳐 Ingress에 도달하는 설정은 여전히 필요합니다. 이 방식은 내부 self-check 경로 문제에만 사용하며, 실제 원인이 외부 DNS나 라우터/방화벽 설정이라면 그쪽을 수정해야 합니다.

## 7. 배포 및 상태 확인

Secret과 ConfigMap을 만든 뒤 애플리케이션 리소스를 적용합니다.

```bash
kubectl apply -f k8s/app.yaml
kubectl get pods,pvc,services

kubectl rollout status deployment/postgres
kubectl rollout status deployment/fastapi
kubectl rollout status deployment/frontend
kubectl get ingress
kubectl get certificate
```

`canieat.kro.kr`의 TLS 인증서가 발급되었는지 다음 명령으로 확인합니다.

```bash
kubectl describe certificate canieat-kro-kr-tls
kubectl describe ingress canieat-frontend
```

Pod 또는 인증서가 준비되지 않으면 상태, 이벤트, 로그를 확인합니다.

```bash
kubectl describe pods
kubectl get events --sort-by=.metadata.creationTimestamp
kubectl logs deployment/postgres
kubectl logs deployment/fastapi
kubectl logs deployment/frontend
kubectl logs -n cert-manager deployment/cert-manager
```

## 8. 브라우저에서 접속

Ingress와 인증서 발급이 완료되고 외부 포트 전달을 설정했다면 다음 기본 HTTPS 주소로 접속합니다.

```text
https://canieat.kro.kr
```

Ingress를 로컬에서 직접 확인하려면 호스트 포트 매핑을 사용해 `http://localhost:18080` 또는 `https://localhost:18443`으로 접속할 수 있습니다. HTTPS 인증서는 `canieat.kro.kr`용이므로 `https://localhost:18443`에서는 인증서 이름 불일치 경고가 발생할 수 있습니다.

kind 포트 매핑 대신 프런트엔드 Service에 직접 포트 포워딩해서 로컬에서 확인할 수도 있습니다. 아래 예시는 로컬 포트 8081을 사용합니다.

```bash
kubectl port-forward service/frontend 8081:80
```

그 상태에서 `http://localhost:8081`으로 접속합니다. `kubectl port-forward`는 Ingress를 우회하며 공개 도메인 접속이나 HTTPS를 설정하지 않습니다.

## 자주 쓰는 운영 명령

이미 배포된 도메인 접속용 앱에 코드, Dockerfile, Nginx 설정 또는 Kubernetes 매니페스트 변경을 반영하려면 저장소 루트에서 실행합니다. `k8s/secrets.yaml`과 `k8s/cluster-issuer.yaml`이 필요하며, 현재 선택된 `kubectl` 컨텍스트를 사용하고 클러스터를 다시 만들지 않습니다. 이미지를 다시 빌드/push하고 Secret, ClusterIssuer, ConfigMap과 앱 매니페스트를 적용한 뒤 세 앱 Deployment를 순차적으로 재시작합니다.

```bash
bash redeploy.sh
```

로컬 접속용으로 이미 배포한 앱을 재배포하려면 다음 명령을 사용합니다. ClusterIssuer는 적용하지 않으며, 재배포 후 `kubectl port-forward service/frontend 8081:80`으로 접속할 수 있습니다.

```bash
bash redeploy-local.sh
```

```bash
# 배포 상태
kubectl get pods,pvc,services
kubectl get deployments

# 특정 Deployment의 로그
kubectl logs deployment/fastapi
kubectl logs deployment/frontend

# 프런트엔드 재시작 후 완료 대기
kubectl rollout restart deployment/frontend
kubectl rollout status deployment/frontend

# Ingress 및 TLS 인증서 상태 확인
kubectl get ingress,certificate
```