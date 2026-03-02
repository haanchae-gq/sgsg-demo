#!/bin/bash

# SGSG 서비스 헬스 체크 스크립트
# 방화벽 문제로 브라우저 테스트가 불가능할 때 curl로 테스트 가능

echo "=== SGSG 서비스 헬스 체크 시작 ==="
echo "시작 시간: $(date)"
echo ""

# 서비스 포트 정의
declare -A services=(
  ["PostgreSQL"]="5432"
  ["백엔드 API"]="3001"
  ["관리자 대시보드"]="3000"  # 실제로는 다른 앱이 실행 중
  ["전문가 앱"]="3002"
  ["소비자 웹"]="3003"
)

# PostgreSQL 헬스 체크 (Docker 컨테이너)
echo "1. PostgreSQL 데이터베이스 체크:"
if docker ps | grep -q sgsg-postgres; then
  echo "   ✓ sgsg-postgres 컨테이너가 실행 중입니다."
  if docker exec sgsg-postgres pg_isready -U sgsg -d sgsg_db >/dev/null 2>&1; then
    echo "   ✓ PostgreSQL 연결 가능 (포트 5432)"
  else
    echo "   ✗ PostgreSQL 연결 실패"
  fi
else
  echo "   ✗ sgsg-postgres 컨테이너가 실행 중이지 않습니다."
fi
echo ""

# 각 서비스 포트 체크
echo "2. 서비스 포트 연결 체크:"
for service in "${!services[@]}"; do
  port=${services[$service]}
  echo -n "   $service (포트 $port): "
  if timeout 2 bash -c "cat < /dev/null > /dev/tcp/127.0.0.1/$port" 2>/dev/null; then
    echo "✓ 연결 가능"
    
    # HTTP 서비스인 경우 추가 체크
    if [[ $port =~ ^300[0-3]$ ]]; then
      status_code=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:$port/" 2>/dev/null || echo "000")
      if [[ $status_code =~ ^[2-3] ]]; then
        echo "     HTTP 상태: $status_code"
      else
        echo "     HTTP 연결 실패 (상태: $status_code)"
      fi
    fi
  else
    echo "✗ 연결 불가"
  fi
done
echo ""

# API 헬스 엔드포인트 체크
echo "3. 백엔드 API 헬스 엔드포인트 체크:"
echo -n "   GET /health: "
if curl -s --connect-timeout 2 "http://localhost:3001/health" >/dev/null 2>&1; then
  response=$(curl -s --connect-timeout 2 "http://localhost:3001/health")
  echo "✓ 응답: $response"
else
  echo "✗ 연결 실패 (API 서비스가 실행 중이지 않을 수 있습니다)"
fi
echo ""

# PM2 프로세스 상태 체크
echo "4. PM2 프로세스 상태:"
if command -v pm2 >/dev/null 2>&1; then
  pm2 list | grep -E "sgsg-|Default" | head -10
else
  echo "   PM2가 설치되지 않았습니다."
fi
echo ""

# 방화벽/네트워크 체크
echo "5. 네트워크 구성 확인:"
echo "   현재 호스트 IP: $(hostname -I 2>/dev/null || echo '확인 불가')"
echo "   로컬호스트 연결 테스트:"
if ping -c 1 -W 1 127.0.0.1 >/dev/null 2>&1; then
  echo "   ✓ 로컬호스트 연결 가능"
else
  echo "   ✗ 로컬호스트 연결 불가 - 시스템 문제"
fi
echo ""

echo "=== 헬스 체크 완료 ==="
echo "완료 시간: $(date)"
echo ""
echo "=== 문제 해결 권장사항 ==="
echo "1. 서비스가 실행 중이지만 연결이 안 되는 경우:"
echo "   - 방화벽 규칙 확인: sudo ufw status"
echo "   - 서비스가 127.0.0.1 대신 0.0.0.0에 바인딩되어 있는지 확인"
echo "   - netstat -tulpn | grep <포트> 명령어로 확인"
echo ""
echo "2. PM2 프로세스가 실행 중이지만 서비스가 응답하지 않는 경우:"
echo "   - 로그 확인: pm2 logs <서비스명>"
echo "   - 프로세스 재시작: pm2 restart <서비스명>"
echo "   - ecosystem.config.js 설정 확인"
echo ""
echo "3. 데이터베이스 연결 문제:"
echo "   - Docker 컨테이너 상태: docker ps | grep postgres"
echo "   - 연결 문자열 확인: .env 파일의 DB_URL 설정"
echo ""
echo "4. 포트 충돌 문제:"
echo "   - 다른 서비스가 동일한 포트를 사용하는지 확인"
echo "   - 포트 변경: .env 파일의 PORT 설정 수정"