#!/bin/bash

# ================================================================
# SGSG Let's Encrypt 인증서 자동 갱신 스크립트
# ================================================================
# 크론잡에서 실행: 0 12 * * * /path/to/this/script.sh
# ================================================================

set -e

echo "🔄 === Let's Encrypt 인증서 갱신 시작 ==="
echo "   ⏰ 실행 시간: $(date)"

cd /home/goqual/sgsg-demo

# 1. 인증서 갱신 시도
echo "1. 📜 인증서 갱신 확인..."
docker compose exec certbot certbot renew --quiet

if [ $? -eq 0 ]; then
    echo "✅ 인증서 갱신 완료 (또는 갱신 불필요)"
    
    # 2. Nginx 재시작하여 새 인증서 적용
    echo "2. 🔄 Nginx 재시작 (새 인증서 적용)..."
    docker compose restart nginx
    
    # 3. SSL 연결 테스트
    echo "3. 🧪 SSL 연결 테스트..."
    if curl -sf https://localhost/health >/dev/null 2>&1; then
        echo "✅ SSL 연결 정상"
        
        # 4. 갱신 알림 (선택사항)
        echo "4. 📧 갱신 성공 알림..."
        echo "SGSG SSL 인증서 갱신 성공 - $(date)" >> /var/log/ssl-renewal.log
    else
        echo "❌ SSL 연결 실패 - 설정 확인 필요"
        exit 1
    fi
else
    echo "❌ 인증서 갱신 실패"
    echo "갱신 실패 - $(date)" >> /var/log/ssl-renewal.log
    exit 1
fi

echo ""
echo "🎉 === 자동 갱신 완료! ==="
echo "   ✅ 인증서: 최신 상태"
echo "   🌐 HTTPS: 정상 작동"
echo "   📅 다음 갱신: $(date -d '+60 days')"