#!/bin/bash

# PostgreSQL 자동 백업 스크립트
# 환경 변수에서 설정을 읽거나 기본값 사용

set -e

# 기본값 설정
BACKUP_DIR=${BACKUP_DIR:-"./backups"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-"5432"}
DB_NAME=${DB_NAME:-"sgsg_db"}
DB_USER=${DB_USER:-"sgsg"}
DB_PASSWORD=${DB_PASSWORD:-"sgsg5goqual123!"}
RETENTION_DAYS=${RETENTION_DAYS:-"7"}

# 백업 디렉토리 생성
mkdir -p "$BACKUP_DIR"

# 현재 날짜와 시간
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_$TIMESTAMP.sql.gz"

# PGPASSWORD 환경 변수 설정
export PGPASSWORD="$DB_PASSWORD"

echo "백업 시작: $DB_NAME -> $BACKUP_FILE"

# pg_dump 실행 (압축 포함)
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  --clean --if-exists --create \
  | gzip > "$BACKUP_FILE"

# 백업 완료 확인
if [ $? -eq 0 ]; then
  echo "백업 성공: $BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "백업 실패!"
  exit 1
fi

# 오래된 백업 삭제 (보존 기간 초과)
echo "$RETENTION_DAYS 일 이상된 백업 파일 삭제 중..."
find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "백업 완료. 최신 백업 파일:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_backup_*.sql.gz 2>/dev/null | tail -5