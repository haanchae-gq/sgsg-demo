# SGSG 서비스 curl 헬스 체크 명령어

방화벽 문제로 브라우저 테스트가 불가능할 때 사용할 수 있는 curl 기반 헬스 체크 명령어입니다.

## 기본 헬스 체크 명령어

### 1. PostgreSQL 데이터베이스
```bash
# Docker 컨테이너 상태 확인
docker ps | grep sgsg-postgres

# PostgreSQL 연결 테스트
docker exec sgsg-postgres pg_isready -U sgsg -d sgsg_db

# 직접 포트 연결 테스트 (포트 5432)
timeout 2 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/5432" && echo "PostgreSQL 연결 가능" || echo "연결 실패"
```

### 2. 백엔드 API (포트 3001)
```bash
# 기본 헬스 엔드포인트
curl -s http://localhost:3001/health

# 상세 정보 포함
curl -v http://localhost:3001/health

# HTTP 상태 코드만 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health

# 타임아웃 설정 (2초)
curl -s --connect-timeout 2 http://localhost:3001/health
```

### 3. 관리자 대시보드 (포트 3000)
```bash
# 현재 실행 중인 서비스 (다른 앱)
curl -s http://localhost:3000

# HTTP 상태 확인
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

### 4. 전문가 앱 (포트 3002)
```bash
# Vite 개발 서버 확인
curl -s http://localhost:3002

# 연결 테스트
curl -s --connect-timeout 2 http://localhost:3002 || echo "서비스 미실행"
```

### 5. 소비자 웹 (포트 3003)
```bash
# Vite 개발 서버 확인
curl -s http://localhost:3003

# 연결 테스트
curl -s --connect-timeout 2 http://localhost:3003 || echo "서비스 미실행"
```

## 통합 체크 스크립트

### 한 번에 모든 서비스 체크
```bash
#!/bin/bash
echo "=== SGSG 서비스 포트 체크 ==="
for port in 3000 3001 3002 3003 5432; do
  service_name=""
  case $port in
    3000) service_name="관리자 대시보드" ;;
    3001) service_name="백엔드 API" ;;
    3002) service_name="전문가 앱" ;;
    3003) service_name="소비자 웹" ;;
    5432) service_name="PostgreSQL" ;;
  esac
  
  echo -n "$service_name (포트 $port): "
  if timeout 2 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/$port" 2>/dev/null; then
    echo "✓ 연결 가능"
  else
    echo "✗ 연결 불가"
  fi
done
```

### API 헬스 체크 상세 버전
```bash
#!/bin/bash
API_URL="http://localhost:3001"

echo "=== API 헬스 체크 ==="

# 1. 기본 연결 테스트
echo -n "API 서버 연결: "
if curl -s --connect-timeout 2 "$API_URL" >/dev/null 2>&1; then
  echo "✓ 성공"
else
  echo "✗ 실패"
  exit 1
fi

# 2. 헬스 엔드포인트
echo -n "헬스 엔드포인트 (/health): "
response=$(curl -s --connect-timeout 2 "$API_URL/health")
if [ $? -eq 0 ]; then
  echo "✓ 응답: $response"
else
  echo "✗ 실패"
fi

# 3. 응답 시간 측정
echo -n "응답 시간: "
time curl -s -o /dev/null -w "전체: %{time_total}s, 연결: %{time_connect}s" "$API_URL/health" 2>&1 | grep -o "전체: .*, 연결: .*"
```

## 문제 진단 명령어

### 포트 확인
```bash
# 모든 포트 확인
netstat -tulpn | grep -E ":(3000|3001|3002|3003|5432)"

# 특정 포트 확인
ss -tulpn | grep :3001
lsof -i :3001
```

### 방화벽 확인
```bash
# UFW 방화벽 상태
sudo ufw status

# 방화벽 규칙 확인
sudo iptables -L -n -v | grep -E "(3000|3001|3002|3003|5432)"
```

### PM2 프로세스 관리
```bash
# 모든 프로세스 상태
pm2 list

# 특정 서비스 로그 확인
pm2 logs sgsg-api --lines 20

# 서비스 재시작
pm2 restart sgsg-api sgsg-adm sgsg-exp sgsg-customer

# 서비스 시작 (ecosystem.config.js 사용)
pm2 start ecosystem.config.js
```

### Docker 컨테이너 확인
```bash
# 모든 컨테이너 상태
docker ps -a

# 특정 컨테이너 로그
docker logs sgsg-postgres --tail 20

# 컨테이너 내부에서 테스트
docker exec sgsg-postgres psql -U sgsg -d sgsg_db -c "SELECT 1;"
```

## 자주 발생하는 문제 및 해결 방법

### 1. "Connection refused" 오류
- 서비스가 실행 중인지 확인: `pm2 list` 또는 `ps aux | grep node`
- 포트가 열려 있는지 확인: `netstat -tulpn | grep :포트번호`
- 서비스가 127.0.0.1 대신 0.0.0.0에 바인딩되었는지 확인

### 2. 방화벽 문제
```bash
# 방화벽 비활성화 (테스트용)
sudo ufw disable

# 특정 포트 열기
sudo ufw allow 3001/tcp
sudo ufw allow 3002/tcp
sudo ufw allow 3003/tcp
```

### 3. 포트 충돌
```bash
# 포트 사용 중인 프로세스 확인
sudo lsof -i :3001

# 포트 변경 방법
# 1. .env 파일에서 PORT 설정 수정
# 2. ecosystem.config.js에서 포트 설정 수정
# 3. 서비스 재시작
```

### 4. PM2 프로세스가 실행 중이지만 서비스 응답 없음
```bash
# 로그 확인
pm2 logs sgsg-api --lines 50

# 프로세스 상세 정보
pm2 describe sgsg-api

# ecosystem.config.js 설정 확인 후 재시작
pm2 delete all
pm2 start ecosystem.config.js
```

## 빠른 테스트를 위한 한 줄 명령어

```bash
# 모든 서비스 한 번에 테스트
for p in 3000 3001 3002 3003; do echo -n "포트 $p: "; curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 http://localhost:$p && echo " OK" || echo " FAIL"; done

# API 헬스 체크만
curl -s http://localhost:3001/health | jq .status 2>/dev/null || curl -s http://localhost:3001/health

# 데이터베이스 연결 테스트
docker exec sgsg-postgres pg_isready -U sgsg -d sgsg_db && echo "DB OK" || echo "DB FAIL"