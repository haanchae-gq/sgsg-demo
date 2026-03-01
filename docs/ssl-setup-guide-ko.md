# SSL/TLS 인증서 설정 가이드 (Let's Encrypt)

이 가이드는 SGSG 플랫폼에 HTTPS를 설정하고 Let's Encrypt SSL 인증서를 발급받는 방법을 설명합니다.

## 목차
1. [사전 준비사항](#사전-준비사항)
2. [도메인 설정](#도메인-설정)
3. [환경 변수 설정](#환경-변수-설정)
4. [인증서 발급 절차](#인증서-발급-절차)
5. [Nginx SSL 구성 활성화](#nginx-ssl-구성-활성화)
6. [자동 갱신 설정](#자동-갱신-설정)
7. [문제 해결](#문제-해결)

## 사전 준비사항

- **도메인 이름**: 플랫폼에 사용할 도메인 (예: `your-domain.com`)
- **서버 접근 권한**: 루트 또는 sudo 권한
- **Docker 및 Docker Compose**: 설치되어 있어야 함
- **포트 열기**: 방화벽에서 80/tcp 및 443/tcp 포트 허용

## 도메인 설정

1. **DNS 레코드 설정**:
   - 도메인의 A 레코드를 서버의 공인 IP 주소로 설정
   - 필요시 www 서브도메인도 동일하게 설정
   ```
   your-domain.com    A    203.0.113.1
   www.your-domain.com A    203.0.113.1
   ```

2. **DNS 전파 확인**:
   ```bash
   dig your-domain.com
   nslookup your-domain.com
   ```

## 환경 변수 설정

프로젝트 루트의 `.env` 파일에 다음 변수를 추가하세요:

```bash
# 도메인 설정
DOMAIN_NAME=your-domain.com
CERTBOT_EMAIL=admin@your-domain.com

# 데이터베이스 설정 (기존)
DB_USER=sgsg
DB_PASSWORD=sgsg5goqual123!
DB_NAME=sgsg_db
DB_PORT=5432

# JWT 시크릿 (프로덕션용 강력한 값으로 변경)
JWT_SECRET=your-production-jwt-secret-key-change-this
```

## 인증서 발급 절차

### 단계 1: Nginx 서비스 시작 (HTTP 모드)

1. **nginx.conf 수정**: `docker/nginx/nginx.conf`에서 HTTPS 서버 블록을 주석 처리하고 HTTP 서버 블록을 활성화합니다:
   ```nginx
   # HTTP to HTTPS redirection (주석 처리)
   # server {
   #     listen 80;
   #     server_name _;
   #     return 301 https://$host$request_uri;
   # }
   
   # Main HTTP server (활성화 상태 유지)
   server {
       listen 80;
       server_name _;
       # ... 나머지 설정
   }
   ```

2. **서비스 시작**:
   ```bash
   cd /home/goqual/sgsg-demo
   docker-compose -f docker-compose.prod.yml up -d postgres backend admin expert nginx
   ```

3. **서비스 상태 확인**:
   ```bash
   docker-compose -f docker-compose.prod.yml ps
   docker-compose -f docker-compose.prod.yml logs nginx
   ```

### 단계 2: 인증서 발급 (Certbot)

1. **Certbot 서비스 실행** (도메인 확인 및 인증서 발급):
   ```bash
   docker-compose -f docker-compose.prod.yml run --rm certbot
   ```

2. **인증서 확인**:
   ```bash
   ls -la ssl/live/your-domain.com/
   ```
   다음 파일들이 있어야 합니다:
   - `cert.pem`: 서버 인증서
   - `privkey.pem`: 개인 키
   - `chain.pem`: 중간 인증서
   - `fullchain.pem`: 전체 인증서 체인

### 단계 3: Nginx SSL 구성

1. **nginx.conf에서 SSL 서버 활성화**:
   - `docker/nginx/nginx.conf` 파일을 열어 HTTPS 서버 블록의 주석을 제거합니다.
   - `your-domain.com`을 실제 도메인으로 변경합니다:
     ```nginx
     server {
         listen 443 ssl http2;
         server_name your-domain.com www.your-domain.com;
         
         # SSL certificate paths
         ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
         ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
         ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
         # ... 나머지 설정
     }
     ```

2. **HTTP에서 HTTPS로 리다이렉트 설정**:
   - HTTP 서버 블록의 리다이렉트 주석을 제거합니다:
     ```nginx
     server {
         listen 80;
         server_name _;
         return 301 https://$host$request_uri;
     }
     ```

3. **Nginx 재시작**:
   ```bash
   docker-compose -f docker-compose.prod.yml restart nginx
   ```

## Nginx SSL 구성 활성화

이미 준비된 `nginx.conf` 파일에는 SSL 설정이 포함되어 있습니다. 다음 사항을 확인하세요:

### SSL 보안 설정
- TLS 1.2 및 1.3 지원
- 보안 헤더 (X-Frame-Options, X-Content-Type-Options 등)
- HSTS (HTTP Strict Transport Security) - 초기 테스트 후 활성화 권장
- 보안 cipher suites

### 프록시 설정
- `/api/` → 백엔드 서비스 (포트 3001)
- `/admin/` → 어드민 대시보드
- `/expert/` → 전문가 웹 앱

## 자동 갱신 설정

Let's Encrypt 인증서는 90일간 유효하며, 60일 이내에 갱신해야 합니다.

### 자동 갱신 스크립트 사용

1. **스크립트 위치**: `scripts/renew-certs.sh`
2. **실행 권한 확인**:
   ```bash
   chmod +x scripts/renew-certs.sh
   ```

3. **Cron 작업 등록**:
   ```bash
   # crontab 편집기 열기
   crontab -e
   
   # 다음 줄 추가 (매주 월요일 오전 3시 실행)
   0 3 * * 1 /home/goqual/sgsg-demo/scripts/renew-certs.sh
   ```

4. **수동 테스트**:
   ```bash
   # dry-run 모드로 테스트
   docker-compose -f docker-compose.prod.yml exec certbot certbot renew --dry-run
   
   # 실제 갱신 테스트
   /home/goqual/sgsg-demo/scripts/renew-certs.sh
   ```

### 모니터링

인증서 만료일 확인:
```bash
docker-compose -f docker-compose.prod.yml exec certbot certbot certificates
```

## 문제 해결

### 일반적인 문제

#### 1. 인증서 발급 실패
- **증상**: Certbot이 도메인 확인에 실패
- **해결책**:
  ```bash
  # DNS 전파 확인
  dig your-domain.com
  
  # 방화벽 확인 (포트 80 열려있는지)
  sudo ufw status
  sudo ufw allow 80/tcp
  ```

#### 2. Nginx SSL 오류
- **증상**: "SSL_ERROR_RX_RECORD_TOO_LONG" 또는 연결 실패
- **해결책**:
  ```bash
  # 인증서 경로 확인
  docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/
  
  # Nginx 설정 테스트
  docker-compose -f docker-compose.prod.yml exec nginx nginx -t
  ```

#### 3. 자동 갱신 실패
- **증상**: cron 작업이 실패
- **해결책**:
  ```bash
  # 로그 확인
  tail -f logs/cert-renewal.log
  
  # 수동 실행 테스트
  sudo /home/goqual/sgsg-demo/scripts/renew-certs.sh
  ```

### 로그 확인

```bash
# Nginx 로그
docker-compose -f docker-compose.prod.yml logs nginx

# Certbot 로그
docker-compose -f docker-compose.prod.yml logs certbot

# 갱신 스크립트 로그
tail -f /home/goqual/sgsg-demo/logs/cert-renewal.log
```

## 보안 권장사항

1. **강력한 비밀번호 사용**:
   - 데이터베이스 비밀번호
   - JWT 시크릿 키
   - 관리자 계정 비밀번호

2. **정기적 업데이트**:
   - Docker 이미지 정기 업데이트
   - 운영체제 보안 패치 적용
   - 인증서 갱신 모니터링

3. **모니터링 설정**:
   - 인증서 만료 알림
   - 서비스 가용성 모니터링
   - 보안 로그 모니터링

## 추가 리소스

- [Let's Encrypt 공식 문서](https://letsencrypt.org/docs/)
- [Certbot 사용 가이드](https://certbot.eff.org/instructions)
- [Nginx SSL 설정 가이드](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Mozilla SSL 구성 생성기](https://ssl-config.mozilla.org/)

## 지원

문제가 발생하면 다음 정보를 수집하여 지원팀에 문의하세요:

1. 도메인 이름
2. 오류 메시지
3. 관련 로그 (`docker-compose logs`)
4. 인증서 상태 (`certbot certificates`)