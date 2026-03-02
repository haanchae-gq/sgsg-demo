# Agent Guide for SGSG Project

This guide helps AI agents work effectively in this Fastify + React + PostgreSQL + Prisma + Ant Design project.

## Project Overview

- **Backend**: Fastify API with Prisma ORM (TypeScript)
- **Frontend**: React with Ant Design (Admin dashboard) and Ant Design Mobile (employee mobile web app)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Styling**: Ant Design components (primary), Tailwind CSS (secondary) with preflight disabled to avoid conflicts
- **Build Tools**: Vite for frontend, TypeScript compiler for backend

## Setup

### Environment Variables

Create `.env` file at project root with the following variables (see `.env.example` for template):

```bash
# Database
DB_URL="postgresql://user:pass@localhost:5432/dbname"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"

# Server
PORT=4000
CORS_ORIGIN="http://localhost:3001,http://localhost:3002"
```

**Important**: The `.env` file already exists with development values. Do not commit it to version control.

### Database Setup

1. Start PostgreSQL via Docker Compose:
   ```bash
   docker-compose up -d postgres
   ```
2. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
3. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

### Project Structure

```
sgsg-demo/
├── sgsg-api/                 # Fastify backend API
│   ├── src/
│   │   ├── app.ts           # Main Fastify application
│   │   ├── routes/          # API routes (empty – ready for implementation)
│   │   ├── services/        # Business logic (empty)
│   │   ├── plugins/         # Fastify plugins (empty)
│   │   ├── types/           # TypeScript types (empty)
│   │   └── utils/           # Utility functions (empty)
│   ├── package.json         # Backend dependencies and scripts
│   └── tsconfig.json        # TypeScript configuration
├── sgsg-adm/                # Admin dashboard (React + Ant Design)
│   ├── src/
│   │   ├── App.tsx          # Root component with router and layout
│   │   ├── main.tsx         # Entry point
│   │   ├── pages/           # Page components (DashboardPage.tsx)
│   │   ├── components/      # Reusable components (Sidebar.tsx)
│   │   ├── hooks/           # Custom React hooks (empty)
│   │   ├── utils/           # Frontend utilities (empty)
│   │   ├── types/           # TypeScript types (empty)
│   │   └── styles/          # Global CSS (global.css)
│   ├── package.json         # Frontend dependencies and scripts
│   ├── vite.config.ts       # Vite configuration with proxy to backend
│   ├── tailwind.config.js   # Tailwind config (preflight disabled)
│   └── tsconfig.json        # TypeScript configuration
├── sgsg-exp/                # Employee mobile web app (React + Ant Design Mobile)
│   ├── src/
│   │   ├── App.tsx          # Root component
│   │   ├── main.tsx         # Entry point
│   │   ├── screens/         # Screen components (HomeScreen.tsx)
│   │   ├── components/      # Reusable components (empty)
│   │   ├── navigation/      # Navigation logic (empty)
│   │   ├── hooks/           # Custom React hooks (empty)
│   │   ├── utils/           # Utilities (empty)
│   │   ├── types/           # TypeScript types (empty)
│   │   └── styles/          # Mobile-specific CSS (mobile.css)
│   ├── package.json         # Frontend dependencies and scripts
│   ├── vite.config.ts       # Vite configuration with proxy to backend
│   ├── tailwind.config.js   # Tailwind config (preflight disabled)
│   └── tsconfig.json        # TypeScript configuration
├── prisma/                  # Prisma schema and migrations
│   └── schema.prisma        # Database schema definition
├── specs/                   # Project specifications and documentation
├── docker/                  # Docker configurations
├── docker-compose.yml       # Docker Compose for PostgreSQL
├── .env                     # Environment variables (ignored by git)
├── .config/crush/crush.json # Crush configuration (LSP, MCP, permissions)
└── AGENTS.md                # This file
```

## Development Servers

The project runs three separate development servers:

- **API Server**: http://localhost:4000 (backend API, not exposed externally)
- **Admin Dashboard**: http://localhost:3001 (React + Ant Design admin interface)
- **Mobile Web App**: http://localhost:3002 (React + Ant Design Mobile employee app)

API requests from frontend applications are proxied through Vite development servers to avoid CORS issues (see `vite.config.ts` files).

## Development Commands

### Backend (sgsg-api)
```bash
cd sgsg-api
npm run dev          # Start development server (tsx watch)
npm run build        # Build for production (tsc)
npm start            # Run production build
npm test             # Run tests (Jest)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

## API Documentation

### Service Catalog API (Newly Implemented - Session 3)
The service catalog API provides a 2-tier service categorization system:

**Available Endpoints:**
- `GET /api/v1/services/categories` - List service categories
- `GET /api/v1/services/categories/:id` - Get category details
- `GET /api/v1/services/categories/tree` - Get full category tree
- `GET /api/v1/services/categories/:id/items` - Get items by category
- `GET /api/v1/services/items` - List all service items
- `GET /api/v1/services/items/:id` - Get item details
- `GET /api/v1/services/items/:id/experts` - Get experts for service

**Features:**
- ✅ Pagination and filtering
- ✅ Search functionality
- ✅ Price range filtering
- ✅ Category-item relationships
- ✅ TypeScript validation with TypeBox
- ✅ Error handling with consistent response format

**Sample Data Available:**
- Categories: 청소 서비스, 집수리 서비스, 이사 서비스
- Items: 정기 청소, 대청소, 싱크대 수리, 콘센트 설치, 소형 이사

**API Documentation:** See `sgsg-api/docs/services-api.md` for detailed usage examples.

**Test the API:**
```bash
# Start the server
cd sgsg-api && npm run dev

# Test endpoints
curl http://localhost:4000/api/v1/services/categories
curl http://localhost:4000/api/v1/services/categories/cl1?includeItems=true
curl http://localhost:4000/api/v1/services/categories/tree
curl "http://localhost:4000/api/v1/services/items?search=청소"
curl "http://localhost:4000/api/v1/services/items?priceRange.min=100000&priceRange.max=200000"
```

### Order & Payment API (Newly Implemented - Session 4)
The order and payment API provides complete order management from creation to payment completion.

**Available Endpoints:**
- `POST /api/v1/orders` - Create new order
- `GET /api/v1/orders` - List orders (filtered by user role)
- `GET /api/v1/orders/:id` - Get order details
- `PUT /api/v1/orders/:id` - Update order information
- `POST /api/v1/orders/:id/cancel` - Cancel order
- `GET /api/v1/orders/:id/notes` - Get order notes
- `POST /api/v1/orders/:id/notes` - Add order note
- `GET /api/v1/orders/:id/attachments` - Get order attachments
- `POST /api/v1/payments/initialize` - Initialize payment
- `POST /api/v1/payments/complete` - Complete payment (PG callback)
- `GET /api/v1/payments/:id` - Get payment details
- `POST /api/v1/payments/:id/refund` - Refund payment (admin only)

**Features:**
- ✅ Complete order lifecycle management
- ✅ Payment state synchronization
- ✅ Role-based access control
- ✅ Order notes and attachments systems
- ✅ Transaction safety with Prisma
- ✅ PG integration structure
- ✅ Automatic order numbering

**Sample Workflow:**
```bash
# Customer login
curl -X POST http://localhost:4000/api/v1/auth/login -H "Content-Type: application/json" -d '{"email":"customer@test.com","password":"Customer@123456"}'

# Create order
curl -X POST http://localhost:4000/api/v1/orders -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d '{"serviceItemId":"it1","addressId":"addr1","requestedDate":"2026-03-05T10:00:00Z","customerNotes":"정기 청소 신청"}'

# Initialize payment
curl -X POST http://localhost:4000/api/v1/payments/initialize -H "Authorization: Bearer {token}" -H "Content-Type: application/json" -d '{"orderId":"{order_id}","paymentType":"deposit","method":"credit_card"}'

# Complete payment (PG callback)
curl -X POST http://localhost:4000/api/v1/payments/complete -H "Content-Type: application/json" -d '{"paymentId":"{payment_id}","pgTransactionId":"PG-TEST-12345","pgResponse":{"status":"success"}}'
```

**Test Data:**
- Customer: customer@test.com / Customer@123456
- Sample Order: ORD-20260301-725992 (정기 청소, 150,000원)
- Payment: 30,000원 예약금 결제 완료

**API Documentation:** See `sgsg-api/docs/orders-payments-api.md` for detailed usage.

### Expert Management API (Implemented - Session 2)
Expert service mapping and management functionality.

**Available Endpoints:**
- `GET /api/v1/experts/me/services` - Get expert service mappings
- `POST /api/v1/experts/me/services` - Add service mapping
- Additional expert management endpoints (partial implementation)

**Sample Expert:**
- Expert: expert@sgsg.com / Expert@123456
- Services: 정기 청소 (140,000원), 대청소 (280,000원)

**Documentation:** See `sgsg-api/docs/experts-api.md` for details.```

### Admin Dashboard (sgsg-adm)
```bash
cd sgsg-adm
npm run dev          # Start Vite dev server (port 3001)
npm run build        # Build for production
npm run preview      # Preview production build
npm test             # Run tests (Jest – no tests yet)
npm run lint         # ESLint (if configured)
```

### Mobile Web App (sgsg-exp)
```bash
cd sgsg-exp
npm run dev          # Start Vite dev server (port 3002)
npm run build        # Build for production
npm run preview      # Preview production build
# Note: No test script defined yet
```

### Database & Prisma (project root)
```bash
npx prisma studio              # Database GUI (opens browser)
npx prisma migrate dev --name "migration_name"
npx prisma generate
```

### Docker
```bash
docker-compose up -d postgres   # Start PostgreSQL only
docker-compose down             # Stop services
```

## Code Conventions

### TypeScript
- Strict mode enabled in all `tsconfig.json`
- Use ES modules (`import`/`export`)
- Define interfaces/types for all data structures
- Prefer `interface` over `type` for object shapes (unless unions, tuples, etc.)

### Backend (Fastify)
- Routes go in `src/routes/` directory (not yet implemented)
- Use Fastify plugins for modularity
- Validate request data with `@sinclair/typebox` schemas (already installed)
- Use Prisma client for database operations (already instantiated in `app.ts`)
- Use async/await, handle errors with `try/catch` or Fastify error handling

### Frontend (React)
- Use functional components with `React.FC` type
- Use Ant Design components (admin) or Ant Design Mobile components (mobile app)
- Follow Ant Design's design patterns and prop conventions
- Use Tailwind CSS for utility styling but keep `preflight: false` to avoid conflicts with Ant Design
- Use CSS modules for component-specific styles (not yet used)
- Organize components by feature (pages, components, hooks, etc.)

### Prisma Schema
- Use `cuid()` for ID defaults
- Define relations clearly with `@relation`
- Add `@updatedAt` and `@createdAt` where appropriate
- Use enums for fixed value sets
- Keep schema in `prisma/schema.prisma` (referenced by backend)

## Testing

- **Backend**: Jest configured with `ts-jest`, `supertest` installed. No test files yet.
- **Frontend (admin)**: Jest and React Testing Library installed. No test files yet.
- **Frontend (mobile)**: No test framework installed yet.
- **Database**: Use Prisma's test transaction rollback for isolated tests.

## Crush Configuration

The project includes a Crush configuration file (`.config/crush/crush.json`) that sets up:

- **LSP**: TypeScript language server and Prisma language server
- **MCP**: PostgreSQL, GitHub, and filesystem servers (some require environment variables)
- **Permissions**: Limited tool access for security

Agents can use these LSP/MCP services for code intelligence, database queries, and file operations.

## Skills Available

The following Crush skills have been created for this project and are available in `/home/goqual/.config/crush/skills/`:

1. **prisma-schema-generator** - Generate or update Prisma schema models for database entities
2. **fastify-route-generator** - Generate Fastify API routes with validation, error handling, and Prisma integration
3. **react-antd-component-generator** - Generate React components using Ant Design (antd) library
4. **fullstack-crud-generator** - Generate complete full-stack CRUD operations including Prisma model, Fastify API routes, and React Ant Design components
5. **prisma-migration-generator** - Generate and manage Prisma migrations for database schema changes
6. **project-setup-generator** - Set up a complete Fastify + React + Prisma + Ant Design project structure
7. **authentication-system-generator** - Generate JWT-based authentication system with login, registration, password reset, and user management
8. **antd-mobile-component-generator** - Generate mobile-optimized React components using Ant Design Mobile for employee web applications
9. **testing-suite-generator** - Generate comprehensive test suites for backend (Fastify + Prisma) and frontend (React + Ant Design)
10. **validation-schema-generator** - Generate validation schemas for request bodies using TypeBox or Zod for Fastify validation and frontend form validation
11. **error-handling-generator** - Generate comprehensive error handling patterns for Fastify backend, React frontend, Prisma database operations, and global error handling

These skills can be used when working on this project to accelerate development of CRUD-based admin dashboards and mobile web applications.

## Gotchas

1. **Database Connections**: Ensure PostgreSQL is running before starting backend. Use `docker-compose up -d postgres`.
2. **CORS & Proxy**: Frontend dev servers proxy `/api` requests to `http://localhost:4000`. Backend CORS is configured to accept origins from `CORS_ORIGIN` environment variable (already set to `http://localhost:3001,http://localhost:3002`).
3. **Environment Variables**: All services share `.env` at project root. The backend reads `DB_URL`, `JWT_SECRET`, etc.
4. **Prisma Client**: Regenerate after schema changes (`npx prisma generate`). The backend already imports `PrismaClient` from `@prisma/client`.
5. **Tailwind Preflight**: Both frontend projects have `preflight: false` in Tailwind config to avoid conflicts with Ant Design base styles. Use Ant Design's design tokens for colors, spacing, etc.
6. **Port Conflicts**: Admin dashboard runs on 3001, mobile app on 3002, API on 4000. Adjust if needed in `.env` and `vite.config.ts`.
7. **TypeScript Strict**: Strict mode is enabled; expect rigorous type checking.

## Contributing

1. Create feature branches from `main`
2. Write tests for new functionality
3. Update documentation as needed
4. Follow existing code patterns
5. Do not commit `.env` or sensitive files

## Operational Features (Session 5)

The project now includes comprehensive operational features for monitoring, logging, backup, and API documentation. All services are managed through Docker Compose for consistent development and production environments.

### API Documentation (Swagger/OpenAPI)

The Fastify API now includes automatic OpenAPI documentation generation using `@fastify/swagger` and `@fastify/swagger-ui`.

**Features:**
- ✅ Automatic schema generation from TypeBox validation schemas
- ✅ Interactive API documentation at `/documentation`
- ✅ OpenAPI 3.0 specification at `/documentation/json`
- ✅ Request/response examples and validation rules
- ✅ Authentication documentation support

**Access:**
- Swagger UI: http://localhost:4000/documentation
- OpenAPI JSON: http://localhost:4000/documentation/json

**Configuration:** Defined in `sgsg-api/src/app.ts` lines 30-36.

### Monitoring System (Prometheus + Grafana)

A complete monitoring stack collects metrics from the Fastify API and provides visualization dashboards.

**Components:**
- **Prometheus**: Metrics collection and storage (port 9090)
- **Grafana**: Visualization dashboards (port 3003)
- **prom-client**: Node.js metrics library integrated into Fastify

**Available Metrics:**
- HTTP request duration, count, and status codes
- Database query performance (via Prisma metrics)
- System resources (CPU, memory, event loop lag)
- Custom business metrics

**Access:**
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3003 (admin/admin)
- API Metrics: http://localhost:4000/metrics

**Configuration Files:**
- `docker/prometheus/prometheus.yml` - Prometheus configuration
- `docker/grafana/provisioning/datasources/prometheus.yml` - Grafana data source

### Logging System (ELK Stack)

Centralized logging using Elasticsearch, Logstash, and Kibana for structured log analysis.

**Components:**
- **Elasticsearch**: Log storage and indexing (port 9200)
- **Logstash**: Log processing pipeline (ports 5044, 5000)
- **Kibana**: Log visualization and analysis (port 5601)
- **Pino**: Structured JSON logging from Fastify

**Log Flow:**
1. Fastify logs to `./logs/app.log` in JSON format
2. Logstash reads log files and parses JSON
3. Elasticsearch indexes logs for fast search
4. Kibana provides dashboards and query interface

**Access:**
- Kibana: http://localhost:5601
- Elasticsearch API: http://localhost:9200
- Log files: `./logs/app.log`

**Configuration Files:**
- `docker/logstash/logstash.conf` - Logstash processing pipeline
- Fastify logging config in `sgsg-api/src/app.ts` lines 56-67

### Automatic Backup System

Scheduled PostgreSQL database backups with retention policy management.

**Features:**
- ✅ Daily automated backups (configurable schedule)
- ✅ 7-day retention (configurable)
- ✅ Backup compression (gzip)
- ✅ Backup verification
- ✅ Email notifications (optional)

**Backup Schedule:** Daily at 2:00 AM (configurable via `CRON_SCHEDULE`)

**Backup Location:** `./backups/` directory with timestamped files

**Configuration:**
- `scripts/backup.sh` - Backup script with error handling
- Docker Compose `backup` service environment variables

### Docker Compose Services

The `docker-compose.yml` file now includes all operational services:

```yaml
services:
  # Core services
  postgres:      # PostgreSQL database (port 5432)
  sgsg-api:      # Fastify API (port 4000)
  
  # Operational services
  prometheus:    # Metrics collection (port 9090)
  grafana:       # Metrics visualization (port 3003)
  elasticsearch: # Log storage (port 9200)
  logstash:      # Log processing (ports 5044, 5000)
  kibana:        # Log visualization (port 5601)
  backup:        # Automated backups (scheduled)
```

**Start All Services:**
```bash
docker-compose up -d postgres prometheus grafana elasticsearch logstash kibana backup sgsg-api
```

**View Logs:**
```bash
docker-compose logs -f [service_name]
```

### Quick Start Guide

1. **Start all operational services:**
   ```bash
   cd /home/goqual/sgsg-demo
   docker-compose up -d postgres prometheus grafana elasticsearch logstash kibana backup
   ```

2. **Start the API server:**
   ```bash
   cd sgsg-api
   npm run dev
   ```

3. **Access the interfaces:**
   - API Documentation: http://localhost:4000/documentation
   - Grafana Dashboards: http://localhost:3003 (admin/admin)
   - Kibana Logs: http://localhost:5601
   - Prometheus: http://localhost:9090

4. **Verify metrics are being collected:**
   ```bash
   curl http://localhost:4000/metrics
   ```

5. **Check logs are being processed:**
   ```bash
   tail -f logs/app.log
   ```

### Configuration Files

Key configuration files for operational features:

1. **Prometheus**: `docker/prometheus/prometheus.yml`
   - Configures scraping targets and intervals
   - Targets `host.docker.internal:4000` for API metrics

2. **Grafana**: `docker/grafana/provisioning/datasources/prometheus.yml`
   - Sets up Prometheus as data source
   - Pre-configured for dashboard import

3. **Logstash**: `docker/logstash/logstash.conf`
   - Defines input (file), filter (JSON), output (Elasticsearch) pipeline
   - Processes `./logs/app.log` JSON logs

4. **Backup Script**: `scripts/backup.sh`
   - Performs `pg_dump` with compression and error handling
   - Implements retention policy

5. **Fastify Configuration**: `sgsg-api/src/app.ts`
   - Swagger/OpenAPI setup (lines 30-36)
   - Prometheus metrics registration (lines 56-67)
   - Structured logging with file output (lines 210-218)

### Environment Variables

Add these to your `.env` file for operational features:

```bash
# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Monitoring
PROMETHEUS_TARGETS=host.docker.internal:4000

# Backup
BACKUP_DIR=./backups
RETENTION_DAYS=7
CRON_SCHEDULE="0 2 * * *"  # Daily at 2 AM

# ELK Stack (defaults usually sufficient)
ELASTICSEARCH_HOSTS=http://elasticsearch:9200
```

**Note:** The backup service uses environment variables from Docker Compose, not the `.env` file.

---

*This document will be updated as the project evolves. Add commands, patterns, and conventions as they are established.*