# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend (Angular - run from project root):**
- `npm start` - Start Angular dev server at http://localhost:4200
- `npm run build` - Production build (output goes to `backend/prod/`)
- `npm test` - Run Jasmine unit tests with Karma
- `npm run lint` - Run TSLint
- `npm run e2e` - Run Protractor end-to-end tests

**Backend (run from project root):**
- `npm run start:server` - Start Express server with nodemon at http://localhost:3000

**Run a single test file:** Karma doesn't support single-file runs natively; use `fdescribe`/`fit` in the test file to focus specific tests.

## Architecture

This is a **MEAN stack** (MongoDB, Express, Angular, Node) data entry app for ACE Contractors Group with real-time multi-client sync.

### Frontend (`src/app/`)

- **`services/body.service.ts`** - Core service: all HTTP calls to `/api/lines`, RxJS subjects for state, print trigger
- **`services/table.datasource.ts`** - Angular Material `DataSource` adapter wrapping `BodyService`
- **`body/line/`** - Form component for adding new line items (item, rate, quantity → amount)
- **`body/table/`** - Table component: displays lines, listens to Socket.io events, calculates running total
- **`report/`** - Print view component; accessed via Angular named router outlet (`outlet: 'print'`)
- **`angular-material.module.ts`** - Central re-export of all Angular Material modules

Environments in `src/environments/` control `apiUrl` and `appUrl` for dev vs. prod. Production build also enables Angular Service Worker (PWA).

### Backend (`backend/`)

- **`server.js`** - HTTP server + Socket.io initialization
- **`app.js`** - Express setup: CORS, body-parser, static serving of `backend/prod`, mounts `/api` routes
- **`routes/lines.js`** - CRUD REST endpoints for `/api/lines`; each mutating operation emits a Socket.io event (`"added"`, `"updated"`, `"deleted"`) to all connected clients
- **`models/line.js`** - Mongoose schema: `item` (string), `rate` (number), `quantity` (number), `amount` (number)

### Data Flow

1. User submits the line form → `BodyService` POST to `/api/lines`
2. Backend saves to MongoDB Atlas and emits Socket.io event to all clients
3. `TableComponent` receives the Socket.io event, calls `BodyService.getLines()`, re-renders table and recalculates totals

### Deployment

Production build is served as static files from `backend/prod/`. Deployed to **AWS Elastic Beanstalk** via `backend/Procfile` (`node backend/server.js`).
