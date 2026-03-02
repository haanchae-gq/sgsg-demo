#!/bin/bash

# ================================================================
# SGSG SSL 인증서 상태 및 보안 점검 스크립트
# ================================================================

set -e

DOMAIN=${1:-"localhost"}

echo "🔍 === SGSG SSL 상태 점검 ==="
echo "   🌐 도메인: $DOMAIN"
echo "   ⏰ 점검 시간: $(date)"
echo ""

# 1. 인증서 만료 날짜 확인
echo "1. 📅 인증서 만료 정보..."
if [ "$DOMAIN" != "localhost" ]; then
    CERT_INFO=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "인증서 정보 없음")
    if [ "$CERT_INFO" != "인증서 정보 없음" ]; then
        echo "$CERT_INFO"
        
        # 만료일 계산
        EXPIRY_DATE=$(echo "$CERT_INFO" | grep "notAfter" | cut -d= -f2)
        EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_TIMESTAMP=$(date +%s)
        DAYS_LEFT=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
        
        echo "📊 만료까지: $DAYS_LEFT일"
        
        if [ $DAYS_LEFT -lt 30 ]; then
            echo "⚠️  경고: 30일 이내 만료!"
        elif [ $DAYS_LEFT -lt 7 ]; then  
            echo "🚨 위험: 7일 이내 만료!"
        else
            echo "✅ 인증서 상태 양호"
        fi
    else
        echo "❌ 인증서 정보 확인 불가"
    fi
else
    echo "🧪 로컬 개발 환경 (자체 서명 인증서)"
fi

echo ""

# 2. SSL 등급 간편 확인
echo "2. 🔒 SSL 보안 등급..."
SSL_GRADE=$(timeout 10s curl -s "https://api.ssllabs.com/api/v3/analyze?host=$DOMAIN&publish=off&all=done" 2>/dev/null | grep -o '"grade":"[^"]*"' | head -1 | cut -d'"' -f4 || echo "N/A")
if [ "$SSL_GRADE" != "N/A" ] && [ "$SSL_GRADE" != "" ]; then
    echo "🏆 SSL Labs 등급: $SSL_GRADE"
else
    echo "📊 SSL 등급: 확인 불가 (온라인 테스트 필요)"
fi

# 3. 서비스 응답 시간 체크
echo ""
echo "3. ⚡ 서비스 응답 시간..."

start_time=$(date +%s%N)
if curl -sf https://$DOMAIN/health >/dev/null 2>&1; then
    end_time=$(date +%s%N)
    response_time=$(( (end_time - start_time) / 1000000 ))  # 밀리초
    echo "✅ HTTPS 응답: ${response_time}ms"
else
    echo "❌ HTTPS 응답 실패"
fi

# 4. Docker 컨테이너 상태
echo ""
echo "4. 🐳 컨테이너 상태..."
docker compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | head -10

# 5. PM2 프로세스 상태  
echo ""
echo "5. ⚙️  PM2 프로세스 상태..."
pm2 jlist 2>/dev/null | grep -o '"name":"[^"]*","status":"[^"]*"' | sed 's/"name":"//g; s/","status":" / - /g; s/"//g' | head -5

echo ""
echo "🎯 === SSL 상태 점검 완료 ==="

# 6. 요약 리포트
echo ""
echo "📋 === 상태 요약 ==="
echo "   🔒 SSL/HTTPS: $([ "$DOMAIN" != "localhost" ] && echo "프로덕션" || echo "개발 환경")"
echo "   🌐 도메인: $DOMAIN"
echo "   ⏰ 점검일: $(date '+%Y-%m-%d %H:%M')"
echo "   📊 다음 점검 권장: $(date -d '+1 week' '+%Y-%m-%d')"