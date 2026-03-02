#!/bin/bash

# ================================================================
# 도메인 설정 시 환경변수 자동 업데이트 스크립트
# ================================================================

set -e

if [ $# -lt 1 ]; then
    echo "사용법: $0 <domain>"
    exit 1
fi

DOMAIN=$1
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_DIR/.env"

echo "🔧 === 도메인 환경변수 업데이트 ==="
echo "   🌐 도메인: $DOMAIN"
echo "   📂 .env 파일: $ENV_FILE"

# 백업 생성
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"
echo "💾 환경변수 백업 생성 완료"

# 환경변수 업데이트
cat > /tmp/sgsg-env-update.sed << EOF
s|NODE_ENV="development"|NODE_ENV="production"|g
s|API_URL="http://localhost:4000"|API_URL="https://$DOMAIN/api"|g
s|ADMIN_URL="http://localhost:3001"|ADMIN_URL="https://$DOMAIN/admin"|g
s|MOBILE_URL="http://localhost:3002"|MOBILE_URL="https://$DOMAIN/expert"|g
s|CORS_ORIGIN=".*"|CORS_ORIGIN="https://$DOMAIN,https://www.$DOMAIN"|g
s|FILE_BASE_URL=".*"|FILE_BASE_URL="https://$DOMAIN/uploads"|g
EOF

sed -i -f /tmp/sgsg-env-update.sed "$ENV_FILE"
rm /tmp/sgsg-env-update.sed

# 프로덕션 전용 환경변수 추가
cat >> "$ENV_FILE" << EOF

# ============================================
# 프로덕션 도메인 설정 (자동 생성됨)
# ============================================
DOMAIN="$DOMAIN"
SSL_ENABLED=true
HTTPS_REDIRECT=true

# 프로덕션 보안 강화
SECURE_COOKIES=true
TRUST_PROXY=true
HELMET_ENABLED=true

# 성능 최적화
COMPRESS_RESPONSES=true
CACHE_CONTROL=true
EOF

echo "✅ 환경변수 프로덕션 설정 완료"
echo ""
echo "📝 주요 변경사항:"
echo "   🌍 NODE_ENV: production"
echo "   🔗 API_URL: https://$DOMAIN/api"  
echo "   👩‍💼 ADMIN_URL: https://$DOMAIN/admin"
echo "   📱 MOBILE_URL: https://$DOMAIN/expert"
echo "   🔒 SSL: 활성화됨"
echo ""
echo "🔄 변경사항 적용을 위해 모든 PM2 프로세스를 재시작하세요:"
echo "   pm2 restart all --update-env"