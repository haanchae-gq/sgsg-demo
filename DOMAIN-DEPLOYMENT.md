# 🌐 SGSG 플랫폼 도메인 배포 가이드

## 📋 현재 상태

✅ **완료된 준비사항**:
- JWT 보안 시스템 (512비트 + 24시간 만료)  
- Nginx SSL Reverse Proxy 인프라
- Let's Encrypt 자동화 스크립트
- 자동 인증서 갱신 시스템
- 모든 서비스 정상 작동 (API + 프론트엔드)

🎯 **운영 준비도**: 99% (도메인 연결만 남음)

---

## 🚀 실제 도메인으로 배포하기

### **필요한 정보**:
- 🌐 **도메인명**: 예) sgsg.com, api.sgsg.com
- 📧 **관리자 이메일**: 예) admin@sgsg.com (Let's Encrypt 알림용)
- 🌍 **DNS 설정**: A 레코드가 이 서버 IP(115.68.102.153)를 가리켜야 함

### **한 번의 명령으로 완전 배포**:

```bash
# 도메인 정보를 받은 즉시 실행
./deploy-domain.sh your-domain.com admin@your-domain.com

# 예시
./deploy-domain.sh sgsg.com admin@sgsg.com
./deploy-domain.sh api.sgsg.com admin@sgsg.com
```

### **배포 프로세스** (자동 실행):
1. 🔧 환경변수 프로덕션 모드 전환
2. 🌐 Nginx 설정 도메인별 업데이트  
3. 📜 Let's Encrypt 인증서 자동 획득
4. 🔒 SSL/HTTPS 활성화
5. 🚀 모든 서비스 프로덕션 모드 재시작
6. ✅ 시스템 검증 및 확인

### **배포 후 접속 주소**:
```
🏠 메인 사이트:     https://your-domain.com
👩‍💼 관리자 대시보드:  https://your-domain.com/admin
🔧 전문가 앱:       https://your-domain.com/expert  
👤 고객 앱:        https://your-domain.com/customer
🔗 API:           https://your-domain.com/api
```

---

## 🛠️ 고급 설정

### **스테이징 모드 테스트** (추천):
```bash
# 처음에는 테스트용으로 실행
./deploy-domain.sh your-domain.com admin@your-domain.com true

# 정상 작동 확인 후 실제 인증서 발급
./deploy-domain.sh your-domain.com admin@your-domain.com false
```

### **SSL 상태 점검**:
```bash
# 인증서 상태 확인
./scripts/check-ssl-status.sh your-domain.com

# 자동 갱신 테스트
docker compose exec certbot certbot renew --dry-run
```

### **수동 인증서 갱신**:
```bash
# 수동 갱신 (크론잡 외)
./docker/certbot/scripts/renew-certificates.sh

# 갱신 로그 확인
tail -f /var/log/sgsg-ssl-renewal.log
```

---

## ⚡ 자동화 기능

### **자동 인증서 갱신**: 
- 📅 **매일 03:30** 자동 갱신 시도
- 🔄 만료 30일 전부터 갱신 시작
- 📧 실패 시 이메일 알림 (선택사항)

### **시스템 모니터링**:
- 🏥 **매주 일요일 04:00** 헬스체크
- 📊 서비스 상태 자동 점검
- 📄 로그 자동 로테이션 (30일)

### **보안 강화**:
- 🛡️ **HSTS Preload** 자동 적용
- ⚡ **Rate Limiting** 활성화
- 🔒 **CSP/XSS 보호** 헤더 적용

---

## 🔧 문제 해결

### **도메인 연결 안될 때**:
```bash
# DNS 확인
nslookup your-domain.com

# 포트 확인  
netstat -tuln | grep ":80\|:443"

# Nginx 로그 확인
docker compose logs nginx --tail 20
```

### **인증서 획득 실패 시**:
```bash
# Certbot 로그 확인
docker compose logs certbot

# 도메인 검증 테스트
curl -I http://your-domain.com/.well-known/acme-challenge/test
```

---

## 📞 비상 롤백

문제 발생 시 즉시 이전 상태로 복구:

```bash
# 자체 서명 인증서로 롤백
docker compose restart nginx

# 개발 환경으로 롤백
cp .env.backup.* .env
pm2 restart all --update-env
```

---

**🎯 준비 완료! 도메인 정보만 있으면 즉시 배포 가능합니다!**