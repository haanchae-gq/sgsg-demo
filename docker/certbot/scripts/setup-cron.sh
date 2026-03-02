#!/bin/bash

# ================================================================
# SGSG Let's Encrypt 자동 갱신 크론잡 설정
# ================================================================

echo "⏰ === Let's Encrypt 자동 갱신 크론잡 설정 ==="

# 현재 스크립트 경로
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"
RENEW_SCRIPT="$SCRIPT_DIR/renew-certificates.sh"

echo "📂 프로젝트 경로: $PROJECT_DIR"
echo "🔄 갱신 스크립트: $RENEW_SCRIPT"

# 갱신 스크립트 실행 권한 부여
chmod +x "$RENEW_SCRIPT"

# 기존 크론잡에서 SGSG 관련 항목 제거
crontab -l 2>/dev/null | grep -v "sgsg\|SGSG\|letsencrypt" | crontab -

# 새로운 크론잡 추가
(crontab -l 2>/dev/null; cat << EOF

# ================================================================
# SGSG 플랫폼 Let's Encrypt 자동 갱신
# ================================================================

# 매일 오전 3시 30분 인증서 갱신 시도
30 3 * * * cd $PROJECT_DIR && bash $RENEW_SCRIPT >> /var/log/sgsg-ssl-renewal.log 2>&1

# 매주 일요일 오전 4시 시스템 상태 점검
0 4 * * 0 cd $PROJECT_DIR && docker compose ps | grep -v "Up" && echo "SGSG 서비스 상태 이상 감지 - \$(date)" >> /var/log/sgsg-system.log

# 매월 1일 오전 5시 로그 로테이션
0 5 1 * * find /var/log -name "*sgsg*" -type f -mtime +30 -delete

EOF
) | crontab -

echo ""
echo "✅ 크론잡 설정 완료!"
echo ""
echo "📋 설정된 자동 작업:"
echo "   🔄 인증서 갱신: 매일 03:30 자동 시도"
echo "   🏥 시스템 점검: 매주 일요일 04:00"
echo "   🧹 로그 정리: 매월 1일 05:00"
echo ""
echo "🔍 크론잡 확인: crontab -l"
echo "📄 갱신 로그: tail -f /var/log/sgsg-ssl-renewal.log"