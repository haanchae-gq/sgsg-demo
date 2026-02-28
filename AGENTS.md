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
npm test             # Run tests (Jest – no tests yet)
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run migrations
npm run prisma:studio    # Open Prisma Studio
```

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

---

*This document will be updated as the project evolves. Add commands, patterns, and conventions as they are established.*