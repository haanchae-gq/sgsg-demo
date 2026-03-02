#!/bin/bash

# ================================================================
# SGSG 플랫폼 Let's Encrypt 자동 SSL 인증서 설정 스크립트
# ================================================================
# 사용법: ./setup-domain.sh your-domain.com admin@your-domain.com
# ================================================================

set -e  # 오류 시 즉시 중단

# 파라미터 확인
if [ $# -lt 2 ]; then
    echo "❌ 사용법: $0 <domain> <email>"
    echo "   예시: $0 sgsg.com admin@sgsg.com"
    echo "   예시: $0 api.sgsg.com admin@sgsg.com"
    exit 1
fi

DOMAIN=$1
EMAIL=$2
STAGING=${3:-false}  # 3번째 파라미터로 staging 모드 설정 가능

echo "🚀 === SGSG Let's Encrypt 자동 설정 시작 ==="
echo "   🌐 도메인: $DOMAIN"
echo "   📧 이메일: $EMAIL"
echo "   🧪 스테이징: $STAGING"
echo ""

# Let's Encrypt 스테이징 서버 사용 여부
if [ "$STAGING" = "true" ]; then
    CERTBOT_SERVER="--staging"
    echo "⚠️  스테이징 모드로 실행 (테스트용)"
else
    CERTBOT_SERVER=""
    echo "🎯 프로덕션 모드로 실행"
fi

# 1. 도메인 연결 확인
echo "1. 🔍 도메인 연결 확인..."
if ! nslookup $DOMAIN >/dev/null 2>&1; then
    echo "❌ 도메인 $DOMAIN이 설정되지 않았거나 이 서버를 가리키지 않습니다."
    echo "   도메인 DNS 설정을 먼저 확인해주세요."
    exit 1
fi
echo "✅ 도메인 연결 확인됨"

# 2. Nginx 설정 업데이트
echo ""
echo "2. 🔧 Nginx 설정 업데이트..."
cat > /tmp/sgsg-domain.conf << EOF
# SGSG 플랫폼 - 실제 도메인 설정

# HTTP 서버 (HTTPS 리다이렉트 + Let's Encrypt)
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt 인증 경로
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }
    
    # 나머지 요청은 HTTPS로 리다이렉트
    location / {
        return 301 https://\$host\$request_uri;
    }
}

# HTTPS 서버 (SSL 종료점)
server {
    listen 443 ssl;
    http2 on;
    server_name $DOMAIN www.$DOMAIN;
    
    # Let's Encrypt SSL 인증서
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/$DOMAIN/chain.pem;
    
    # 모던 SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # 보안 헤더
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
    
    # API 백엔드
    location /api/ {
        proxy_pass http://115.68.102.153:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
        proxy_buffering off;
        
        # API Rate limiting
        limit_req zone=api_limit burst=20 nodelay;
        limit_req_status 429;
    }
    
    # 인증 API (더 엄격한 제한)
    location /api/v1/auth/ {
        proxy_pass http://115.68.102.153:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # 인증 API Rate limiting
        limit_req zone=auth_limit burst=5 nodelay;
        limit_req_status 429;
    }
    
    # 관리자 대시보드
    location /admin {
        proxy_pass http://115.68.102.153:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 전문가 모바일 앱
    location /expert {
        proxy_pass http://115.68.102.153:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 고객 모바일 앱  
    location /customer {
        proxy_pass http://115.68.102.153:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # 헬스체크
    location /health {
        proxy_pass http://115.68.102.153:4000/health;
        proxy_set_header Host \$host;
        access_log off;
    }
    
    # 업로드 파일
    location /uploads/ {
        proxy_pass http://115.68.102.153:4000/uploads/;
        expires 1M;
        add_header Cache-Control "public, immutable";
        access_log off;
    }
    
    # 기본 루트 → 관리자 대시보드
    location / {
        return 301 https://\$host/admin/;
    }
}
EOF

# 설정 파일 복사
docker cp /tmp/sgsg-domain.conf sgsg-nginx:/etc/nginx/conf.d/
rm /tmp/sgsg-domain.conf

echo "✅ Nginx 설정 업데이트 완료"

# 3. Let's Encrypt 인증서 획득
echo ""
echo "3. 🔒 Let's Encrypt 인증서 획득..."
docker compose exec certbot certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    $CERTBOT_SERVER \
    -d $DOMAIN \
    -d www.$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ Let's Encrypt 인증서 획득 성공!"
else
    echo "❌ 인증서 획득 실패. 도메인 설정을 확인해주세요."
    exit 1
fi

# 4. Nginx 설정 활성화 및 재시작
echo ""
echo "4. 🔄 Nginx SSL 설정 활성화..."
docker compose restart nginx

# 5. 자동 갱신 크론잡 설정
echo ""
echo "5. ⏰ 자동 갱신 스케줄 설정..."
(crontab -l 2>/dev/null; echo "0 12 * * * docker compose exec certbot certbot renew --quiet && docker compose restart nginx") | crontab -

echo ""
echo "🎉 === Let's Encrypt 자동화 설정 완료! ==="
echo "   🌐 도메인: https://$DOMAIN"
echo "   🔒 SSL 인증서: 활성화됨"
echo "   🔄 자동 갱신: 매일 오후 12시"
echo "   ✨ 프로덕션 준비: 완료!"
echo ""
echo "📋 다음 확인 사항:"
echo "   1. https://$DOMAIN 접속 테스트"
echo "   2. SSL 등급 확인: https://www.ssllabs.com/ssltest/"
echo "   3. 자동 갱신 테스트: docker compose exec certbot certbot renew --dry-run"