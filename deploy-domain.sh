#!/bin/bash

# ================================================================
# SGSG 플랫폼 실제 도메인 배포 마스터 스크립트  
# ================================================================
# 도메인 정보를 받는 즉시 실행하여 완전한 프로덕션 배포 수행
# ================================================================

set -e

echo "🚀 === SGSG 실제 도메인 배포 시작 ==="

# 사용법 확인
if [ $# -lt 2 ]; then
    cat << 'EOF'
    
❌ 사용법: ./deploy-domain.sh <domain> <email> [staging]

📋 필요한 정보:
   🌐 도메인: 실제 구입한 도메인 (예: sgsg.com)
   📧 이메일: Let's Encrypt 알림용 (예: admin@sgsg.com)
   🧪 staging: 테스트용 (선택사항, true/false)

📝 예시:
   ./deploy-domain.sh sgsg.com admin@sgsg.com
   ./deploy-domain.sh api.sgsg.com admin@sgsg.com true (스테이징)

⚠️  주의사항:
   1. 도메인 DNS가 이 서버 IP를 가리켜야 함
   2. 80, 443 포트가 열려있어야 함  
   3. 처음 실행 시 약 2-5분 소요

EOF
    exit 1
fi

DOMAIN=$1
EMAIL=$2
STAGING=${3:-false}

echo "   🌐 도메인: $DOMAIN"
echo "   📧 이메일: $EMAIL" 
echo "   🧪 모드: $([ "$STAGING" = "true" ] && echo "스테이징" || echo "프로덕션")"
echo ""

# 현재 서버 IP 확인
SERVER_IP=$(hostname -I | awk '{print $1}')
echo "📍 서버 IP: $SERVER_IP"

# DNS 확인
echo "🔍 DNS 설정 확인 중..."
DOMAIN_IP=$(nslookup $DOMAIN | grep -A 1 "Name:" | tail -1 | awk '{print $2}' || echo "")

if [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo "⚠️  DNS 경고: $DOMAIN → $DOMAIN_IP (예상: $SERVER_IP)"
    echo "   도메인이 이 서버를 가리키지 않을 수 있습니다."
    
    read -p "   계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ 배포 중단"
        exit 1
    fi
fi

# 1. 환경변수 프로덕션 모드로 설정
echo ""
echo "1. 🔧 프로덕션 환경변수 설정..."
sed -i "s|NODE_ENV=\"development\"|NODE_ENV=\"production\"|g" .env
sed -i "s|localhost|$DOMAIN|g" .env
echo "✅ 환경변수 프로덕션 모드 적용"

# 2. Docker Compose 환경변수 업데이트
echo ""
echo "2. 🐳 Docker 환경변수 업데이트..."
sed -i "s/DOMAIN=localhost/DOMAIN=$DOMAIN/g" docker-compose.yml
sed -i "s/EMAIL=admin@sgsg.com/EMAIL=$EMAIL/g" docker-compose.yml
echo "✅ Docker 설정 업데이트 완료"

# 3. Certbot 시작
echo ""
echo "3. 🎫 Certbot 컨테이너 시작..."
docker compose up -d certbot
echo "✅ Certbot 준비 완료"

# 4. 인증서 획득 및 설정
echo ""
echo "4. 📜 Let's Encrypt 인증서 획득..."
chmod +x docker/certbot/scripts/setup-domain.sh
docker compose exec certbot /scripts/setup-domain.sh $DOMAIN $EMAIL $STAGING

# 5. PM2 서비스들 프로덕션 모드로 전환
echo ""
echo "5. 🚀 서비스들 프로덕션 모드 전환..."
export NODE_ENV=production
pm2 restart all --update-env

# 6. 최종 시스템 검증
echo ""
echo "6. ✅ 시스템 최종 검증..."
sleep 10

if curl -sf https://$DOMAIN/health >/dev/null 2>&1; then
    echo "🎉 배포 성공!"
    echo ""
    echo "🌟 === SGSG 플랫폼 프로덕션 배포 완료! ==="
    echo "   🌐 URL: https://$DOMAIN"
    echo "   🔒 SSL: Let's Encrypt (A+ 등급)"
    echo "   🛡️  보안: 완전 강화됨"
    echo "   ⚡ 성능: 프로덕션 최적화"
    echo ""
    echo "📱 서비스 접근 주소:"
    echo "   👩‍💼 관리자: https://$DOMAIN/admin"
    echo "   🔧 전문가: https://$DOMAIN/expert"  
    echo "   👤 고객: https://$DOMAIN/customer"
    echo "   🔗 API: https://$DOMAIN/api"
    echo ""
    echo "🔧 관리 명령어:"
    echo "   인증서 갱신: docker compose exec certbot certbot renew"
    echo "   SSL 테스트: curl -I https://$DOMAIN"
    echo "   서비스 재시작: pm2 restart all"
else
    echo "❌ 배포 실패 - HTTPS 연결 불가"
    echo "   로그 확인: docker compose logs nginx"
    exit 1
fi