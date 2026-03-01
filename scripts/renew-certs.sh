#!/bin/bash
# SSL Certificate Renewal Script for SGSG Platform
# This script renews Let's Encrypt certificates and reloads Nginx

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Log function
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_info() {
    log "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    log "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    log "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root"
    exit 1
fi

# Configuration
PROJECT_ROOT="/home/goqual/sgsg-demo"
CERTBOT_CONTAINER="sgsg-certbot-prod"
NGINX_CONTAINER="sgsg-nginx-prod"
LOG_FILE="${PROJECT_ROOT}/logs/cert-renewal.log"
BACKUP_DIR="${PROJECT_ROOT}/ssl/backup/$(date +%Y%m%d_%H%M%S)"

# Create log directory
mkdir -p "$(dirname "$LOG_FILE")"

# Redirect all output to log file
exec >> "$LOG_FILE" 2>&1

log_info "Starting SSL certificate renewal process"

# Backup current certificates
log_info "Backing up current certificates to $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
cp -r "${PROJECT_ROOT}/ssl/live" "$BACKUP_DIR/" 2>/dev/null || log_warn "No existing certificates to backup"

# Run certbot renew in the certbot container
log_info "Running certbot renew..."
if docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T certbot certbot renew --quiet; then
    log_info "Certificate renewal successful"
    
    # Check if certificates were actually renewed
    if docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T certbot certbot renew --dry-run; then
        log_info "Certificates are not due for renewal yet"
    else
        log_info "Certificates were renewed, reloading Nginx..."
        
        # Reload Nginx configuration
        if docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" exec -T nginx nginx -s reload; then
            log_info "Nginx reloaded successfully"
        else
            log_error "Failed to reload Nginx"
            log_info "Trying to restart Nginx container..."
            docker-compose -f "${PROJECT_ROOT}/docker-compose.prod.yml" restart nginx
        fi
    fi
else
    log_error "Certificate renewal failed"
    log_info "Restoring from backup..."
    if [ -d "${BACKUP_DIR}/live" ]; then
        cp -r "${BACKUP_DIR}/live" "${PROJECT_ROOT}/ssl/"
        log_info "Backup restored"
    fi
    exit 1
fi

log_info "SSL certificate renewal process completed successfully"