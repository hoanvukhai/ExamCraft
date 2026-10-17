#!/usr/bin/env bash
# Script Sao Lưu Tự Động PostgreSQL (Linux / Docker)
# ExamCraft v3.1 Architecture

set -euo pipefail

BACKUP_DIR="${1:-backups}"
CONTAINER_NAME="${2:-examcraft_postgres}"
DB_USER="${3:-examcraft}"
DB_NAME="${4:-examcraft}"
KEEP_DAYS=7

mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_FILE="$BACKUP_DIR/examcraft_backup_$TIMESTAMP.sql"

echo "=== ExamCraft PostgreSQL Backup Service ==="
echo "[*] Đang sao lưu từ container: $CONTAINER_NAME..."

docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" --clean --if-exists "$DB_NAME" > "$OUTPUT_FILE"

if [ -s "$OUTPUT_FILE" ]; then
    echo "[✓] Sao lưu thành công: $OUTPUT_FILE ($(du -h "$OUTPUT_FILE" | cut -f1))"
else
    echo "[!] File sao lưu rỗng hoặc lỗi!" >&2
    exit 1
fi

# Xóa các file cũ hơn 7 ngày
find "$BACKUP_DIR" -name "examcraft_backup_*.sql" -type f -mtime +"$KEEP_DAYS" -delete
echo "[✓] Đã dọn dẹp các bản sao lưu cũ hơn $KEEP_DAYS ngày."
