# SGSG 서비스 PM2 운영 가이드

## 서비스 구성

4개의 서비스가 PM2로 관리되고 있습니다:

| 서비스명 | 포트 | 설명 |
|---------|------|------|
| sgsg-api | 4000 | Fastify API 서버 |
| sgsg-adm | 3001 | 관리자 웹 대시보드 |
| sgsg-exp | 3002 | 전문가 모바일 웹앱 |
| sgsg-customer | 3003 | 소비자 모바일 웹앱 |

## PM2 명령어

### 기본 명령어
```bash
# PM2 홈 디렉토리 설정 (필수)
export PM2_HOME=/home/goqual/.pm2

# 상태 확인
npx pm2 status

# 모든 서비스 시작
npx pm2 start ecosystem.config.js

# 모든 서비스 중지
npx pm2 stop all

# 모든 서비스 재시작
npx pm2 restart all

# 설정 리로드 (무중단 업데이트)
npx pm2 reload ecosystem.config.js

# 로그 확인
npx pm2 logs

# 특정 서비스 로그
npx pm2 logs sgsg-api
npx pm2 logs sgsg-adm
npx pm2 logs sgsg-exp
npx pm2 logs sgsg-customer
```

### 개별 서비스 관리
```bash
# 개별 서비스 시작/중지/재시작
npx pm2 start sgsg-api
npx pm2 stop sgsg-api
npx pm2 restart sgsg-api

# 개별 서비스 삭제
npx pm2 delete sgsg-api
```

## 접속 URL

- **API**: http://localhost:4000
- **관리자 웹**: http://localhost:3001
- **전문가 앱**: http://localhost:3002  
- **소비자 웹**: http://localhost:3003

## 로그 파일 위치

```
/home/goqual/sgsg-demo/logs/
├── api-error.log / api-out.log
├── admin-error.log / admin-out.log  
├── expert-error.log / expert-out.log
└── customer-error.log / customer-out.log
```

## 운영 팁

1. **서비스 상태 모니터링**: `npx pm2 status`로 정기적 확인
2. **로그 모니터링**: `npx pm2 logs --lines 50`으로 최근 로그 확인
3. **메모리 사용량 확인**: PM2 상태에서 메모리 사용량 모니터링
4. **자동 재시작**: 서비스 오류 시 자동으로 재시작됨

## 주의사항

- PM2 명령어 실행 시 반드시 `export PM2_HOME=/home/goqual/.pm2` 설정 필요
- Node.js 버전 호환성으로 인해 개발 모드로 운영 중
- 모든 서비스는 `0.0.0.0` 호스트로 외부 접근 허용

## 문제 해결

### 서비스가 시작되지 않을 때
```bash
# 로그 확인
npx pm2 logs [서비스명] --lines 50

# 서비스 삭제 후 재시작  
npx pm2 delete [서비스명]
npx pm2 start ecosystem.config.js
```

### 포트 충돌 확인
```bash
# 다른 프로세스가 포트를 사용 중인지 확인
lsof -i :4000
lsof -i :3001
lsof -i :3002  
lsof -i :3003
```