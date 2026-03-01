#!/bin/bash
# Production Deployment Script for SGSG Platform

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Configuration
PROJECT_ROOT="/home/goqual/sgsg-demo"
COMPOSE_FILE="${PROJECT_ROOT}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_ROOT}/backups/$(date +%Y%m%d_%H%M%S)"

# Check if running as root
if [[ $EUID -ne 0 ]]; then
    log_error "This script must be run as root or with sudo"
    exit 1
fi

# Function to display usage
usage() {
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  setup        - Initial setup (build images, create volumes)"
    echo "  start        - Start all services"
    echo "  stop         - Stop all services"
    echo "  restart      - Restart all services"
    echo "  update       - Update images and restart services"
    echo "  backup       - Backup database and configuration"
    echo "  logs         - Show logs from all services"
    echo "  status       - Show service status"
    echo "  cert-renew   - Renew SSL certificates"
    echo ""
    echo "Examples:"
    echo "  $0 setup     # First-time setup"
    echo "  $0 start     # Start production services"
    echo "  $0 update    # Update and restart"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        log_error "Docker is not running. Please start Docker daemon."
        exit 1
    fi
}

# Function to check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        log_error "Docker Compose is not installed."
        exit 1
    fi
}

# Function to setup environment
setup() {
    log_info "Starting initial setup..."
    
    # Check environment file
    if [ ! -f "${PROJECT_ROOT}/.env" ]; then
        log_warn ".env file not found. Creating from example..."
        if [ -f "${PROJECT_ROOT}/.env.example" ]; then
            cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
            log_info "Please edit .env file with your configuration"
            nano "${PROJECT_ROOT}/.env" || vim "${PROJECT_ROOT}/.env" || vi "${PROJECT_ROOT}/.env"
        else
            log_error "No .env.example file found. Please create .env manually."
            exit 1
        fi
    fi
    
    # Create necessary directories
    log_info "Creating directories..."
    mkdir -p "${PROJECT_ROOT}/ssl"
    mkdir -p "${PROJECT_ROOT}/logs"
    mkdir -p "${PROJECT_ROOT}/docker/nginx/html"
    mkdir -p "${PROJECT_ROOT}/docker/nginx/certbot"
    
    # Build images
    log_info "Building Docker images..."
    docker-compose -f "$COMPOSE_FILE" build
    
    # Create volumes
    log_info "Creating Docker volumes..."
    docker volume create sgsg-postgres-data-prod 2>/dev/null || true
    
    log_info "Setup completed successfully!"
    log_info "Next steps:"
    log_info "1. Configure your domain in .env file (DOMAIN_NAME, CERTBOT_EMAIL)"
    log_info "2. Run '$0 start' to start services"
    log_info "3. Run SSL certificate setup (see docs/ssl-setup-guide-ko.md)"
}

# Function to start services
start() {
    log_info "Starting production services..."
    docker-compose -f "$COMPOSE_FILE" up -d
    log_info "Services started successfully!"
    
    # Show status
    sleep 3
    status
}

# Function to stop services
stop() {
    log_info "Stopping production services..."
    docker-compose -f "$COMPOSE_FILE" down
    log_info "Services stopped successfully!"
}

# Function to restart services
restart() {
    log_info "Restarting production services..."
    docker-compose -f "$COMPOSE_FILE" restart
    log_info "Services restarted successfully!"
}

# Function to update services
update() {
    log_info "Updating services..."
    
    # Pull latest images
    log_info "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Rebuild and restart
    log_info "Rebuilding and restarting..."
    docker-compose -f "$COMPOSE_FILE" up -d --build
    
    log_info "Update completed successfully!"
}

# Function to backup data
backup() {
    log_info "Starting backup..."
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    log_info "Backing up database..."
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U sgsg sgsg_db > "${BACKUP_DIR}/database.sql" 2>/dev/null || \
        log_warn "Database backup failed (container may not be running)"
    
    # Backup SSL certificates
    log_info "Backing up SSL certificates..."
    cp -r "${PROJECT_ROOT}/ssl" "${BACKUP_DIR}/" 2>/dev/null || \
        log_warn "SSL certificates backup failed"
    
    # Backup configuration
    log_info "Backing up configuration..."
    cp "${PROJECT_ROOT}/.env" "${BACKUP_DIR}/" 2>/dev/null
    cp "${PROJECT_ROOT}/docker-compose.prod.yml" "${BACKUP_DIR}/" 2>/dev/null
    cp -r "${PROJECT_ROOT}/docker/nginx" "${BACKUP_DIR}/nginx" 2>/dev/null
    
    # Create backup archive
    log_info "Creating backup archive..."
    tar -czf "${BACKUP_DIR}.tar.gz" -C "${PROJECT_ROOT}/backups" "$(basename "$BACKUP_DIR")" 2>/dev/null
    
    log_info "Backup completed: ${BACKUP_DIR}.tar.gz"
    log_info "Backup contents:"
    ls -la "$BACKUP_DIR"
}

# Function to show logs
logs() {
    log_info "Showing logs (Ctrl+C to exit)..."
    docker-compose -f "$COMPOSE_FILE" logs -f
}

# Function to show status
status() {
    log_info "Service status:"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "Resource usage:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}" | head -n 6
    
    echo ""
    log_info "Recent logs (last 10 lines):"
    docker-compose -f "$COMPOSE_FILE" logs --tail=10
}

# Function to renew certificates
cert_renew() {
    log_info "Renewing SSL certificates..."
    "${PROJECT_ROOT}/scripts/renew-certs.sh"
}

# Main script execution
check_docker
check_docker_compose

case "${1:-}" in
    setup)
        setup
        ;;
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        restart
        ;;
    update)
        update
        ;;
    backup)
        backup
        ;;
    logs)
        logs
        ;;
    status)
        status
        ;;
    cert-renew)
        cert_renew
        ;;
    *)
        usage
        exit 1
        ;;
esac