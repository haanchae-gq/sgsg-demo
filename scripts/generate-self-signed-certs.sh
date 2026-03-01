#!/bin/bash
# Self-signed SSL Certificate Generator for Testing
# This script generates self-signed certificates for development/testing environments

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
SSL_DIR="${PROJECT_ROOT}/ssl/self-signed"
DOMAIN="localhost"
ALT_DOMAINS="localhost 127.0.0.1 ::1"

# Create SSL directory
mkdir -p "$SSL_DIR"

log_info "Generating self-signed SSL certificates for testing"

# Generate private key
log_info "Generating RSA private key (2048 bits)..."
openssl genrsa -out "$SSL_DIR/privkey.pem" 2048 2>/dev/null

# Generate certificate signing request (CSR)
log_info "Creating certificate signing request..."
openssl req -new \
    -key "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/cert.csr" \
    -subj "/C=KR/ST=Seoul/L=Gangnam/O=SGSG/CN=$DOMAIN" 2>/dev/null

# Create ext file for Subject Alternative Names (SAN)
log_info "Creating SAN configuration..."
cat > "$SSL_DIR/san.ext" << EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
subjectAltName = @alt_names

[alt_names]
DNS.1 = $DOMAIN
DNS.2 = localhost
IP.1 = 127.0.0.1
IP.2 = ::1
EOF

# Generate self-signed certificate
log_info "Generating self-signed certificate (valid for 365 days)..."
openssl x509 -req \
    -in "$SSL_DIR/cert.csr" \
    -signkey "$SSL_DIR/privkey.pem" \
    -out "$SSL_DIR/cert.pem" \
    -days 365 \
    -sha256 \
    -extfile "$SSL_DIR/san.ext" 2>/dev/null

# Create fullchain.pem (cert + chain)
log_info "Creating fullchain.pem..."
cp "$SSL_DIR/cert.pem" "$SSL_DIR/fullchain.pem"

# Create chain.pem (empty for self-signed)
log_info "Creating chain.pem..."
touch "$SSL_DIR/chain.pem"

# Set proper permissions
log_info "Setting file permissions..."
chmod 600 "$SSL_DIR/privkey.pem"
chmod 644 "$SSL_DIR/cert.pem" "$SSL_DIR/fullchain.pem" "$SSL_DIR/chain.pem"

# Create Nginx configuration for self-signed certs
log_info "Creating Nginx configuration for self-signed certificates..."
cat > "$PROJECT_ROOT/docker/nginx/self-signed.conf" << EOF
# Self-signed SSL configuration for testing
server {
    listen 443 ssl http2;
    server_name localhost;
    
    # Self-signed certificate paths
    ssl_certificate /etc/ssl/self-signed/fullchain.pem;
    ssl_certificate_key /etc/ssl/self-signed/privkey.pem;
    
    # SSL configuration (same as production)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Proxy settings
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /admin/ {
        proxy_pass http://admin:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    location /expert/ {
        proxy_pass http://expert:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}

# HTTP to HTTPS redirect for testing
server {
    listen 80;
    server_name localhost;
    return 301 https://localhost\$request_uri;
}
EOF

# Create docker-compose test configuration
log_info "Creating docker-compose.test.yml for testing..."
cat > "$PROJECT_ROOT/docker-compose.test.yml" << EOF
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: sgsg-postgres-test
    environment:
      POSTGRES_USER: sgsg
      POSTGRES_PASSWORD: sgsg5goqual123!
      POSTGRES_DB: sgsg_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data_test:/var/lib/postgresql/data
    networks:
      - sgsg-network-test
    restart: unless-stopped

  backend:
    build:
      context: ./sgsg-api
      dockerfile: Dockerfile.dev
    container_name: sgsg-backend-test
    environment:
      NODE_ENV: development
      DB_URL: postgresql://sgsg:sgsg5goqual123!@postgres:5432/sgsg_db
      JWT_SECRET: test-jwt-secret
      PORT: 3001
    ports:
      - "3001:3001"
    volumes:
      - ./sgsg-api:/app
      - /app/node_modules
    depends_on:
      - postgres
    networks:
      - sgsg-network-test
    restart: unless-stopped

  admin:
    build:
      context: ./sgsg-adm
      dockerfile: Dockerfile.dev
    container_name: sgsg-admin-test
    environment:
      NODE_ENV: development
      VITE_API_URL: /api
    ports:
      - "3000:3000"
    volumes:
      - ./sgsg-adm:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - sgsg-network-test
    restart: unless-stopped

  expert:
    build:
      context: ./sgsg-exp
      dockerfile: Dockerfile.dev
    container_name: sgsg-expert-test
    environment:
      NODE_ENV: development
      VITE_API_URL: /api
    ports:
      - "3002:3002"
    volumes:
      - ./sgsg-exp:/app
      - /app/node_modules
    depends_on:
      - backend
    networks:
      - sgsg-network-test
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    container_name: sgsg-nginx-test
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/self-signed.conf:/etc/nginx/conf.d/default.conf:ro
      - ./ssl/self-signed:/etc/ssl/self-signed:ro
      - ./docker/nginx/html:/var/www/html
    depends_on:
      - backend
      - admin
      - expert
    networks:
      - sgsg-network-test
    restart: unless-stopped

volumes:
  postgres_data_test:
    driver: local

networks:
  sgsg-network-test:
    driver: bridge
EOF

log_info "Self-signed certificate generation completed!"
log_info "Certificate files created in: $SSL_DIR"
log_info ""
log_info "To use self-signed certificates for testing:"
log_info "1. Run: docker-compose -f docker-compose.test.yml up -d"
log_info "2. Access: https://localhost/admin"
log_info "3. Browser warning: Accept the security exception (self-signed cert)"
log_info ""
log_info "Files generated:"
log_info "  - privkey.pem: Private key"
log_info "  - cert.pem: Server certificate"
log_info "  - fullchain.pem: Full certificate chain"
log_info "  - chain.pem: CA chain (empty for self-signed)"
log_info ""
log_info "Certificate details:"
openssl x509 -in "$SSL_DIR/cert.pem" -text -noout | grep -E "Subject:|Issuer:|Not Before:|Not After :"

log_info "Test configuration files created:"
log_info "  - docker/nginx/self-signed.conf"
log_info "  - docker-compose.test.yml"