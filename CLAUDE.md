# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Frontend (Angular - run from project root):**
- `npm start` - Start Angular dev server at http://localhost:4200
- `npm run build` - Production build (output goes to `backend/prod/`)
- `npm test` - Run Jasmine/Karma unit tests
- `npm run lint` - Run TSLint
- `npm run e2e` - Run Protractor end-to-end tests

**Backend (run from project root):**
- `npm run start:server` - Start Express server with nodemon at http://localhost:3000
- `npm run test:server` - Run Jest backend tests
- `npm run test:all` - Run all tests (frontend headless + backend)

**Run a single test file:** Karma doesn't support single-file runs natively; use `fdescribe`/`fit` in the test file to focus specific tests.

## Architecture

This is a **MEAN stack** (MongoDB Atlas, Express 5, Angular 21, Node.js) project management app for ACE Contractors Group with real-time multi-client sync via Socket.io.

**Production URL:** http://ace-contractors-prod.eba-kz2ssxnw.ap-southeast-2.elasticbeanstalk.com/

### Frontend (`src/app/`)

- **`services/body.service.ts`** - Core service: HTTP calls to `/api/lines`, RxJS subjects for state, print trigger, pagination/sort/filter support
- **`services/table.datasource.ts`** - Angular Material `DataSource` adapter wrapping `BodyService`
- **`services/project.service.ts`** - HTTP calls to `/api/projects`; BehaviorSubjects for selected project and project list
- **`services/client.service.ts`** - HTTP calls to `/api/clients`; BehaviorSubject for client list
- **`body/line/`** - Form component for adding new line items (item, category, rate, quantity, taxable, taxRate → amount)
- **`body/table/`** - Table component: inline row editing, Socket.io listeners, subtotal/tax/grand total footer, server-side pagination & sort
- **`projects/project-selector/`** - Project selector dropdown with create/delete, status workflow UI (draft→sent→approved→paid), and PDF invoice download button
- **`report/`** - Print view component; accessed via Angular named router outlet (`outlet: 'print'`), uses date-fns for formatting
- **`angular-material.module.ts`** - Central re-export of all Angular Material modules

Environments in `src/environments/` control `apiUrl` and `appUrl` for dev vs. prod. Production build also enables Angular Service Worker (PWA).

### Backend (`backend/`)

- **`server.js`** - HTTP server + Socket.io initialisation
- **`app.js`** - Express setup: CORS, body-parser, Helmet, compression, rate-limiting, static serving of `backend/prod/`, mounts `/api` routes
- **`routes/lines.js`** - CRUD REST endpoints for `/api/lines`; supports `?page`, `?pageSize`, `?sortField`, `?sortDir`, `?filter`, `?projectId`; emits Socket.io events (`"added"`, `"updated"`, `"deleted"`)
- **`routes/projects.js`** - CRUD REST endpoints for `/api/projects`; `DELETE` also removes associated lines; emits `"projectAdded"`, `"projectUpdated"`, `"projectDeleted"`; `GET /:id/invoice.pdf` streams a PDFKit invoice
- **`routes/clients.js`** - CRUD REST endpoints for `/api/clients`
- **`models/line.js`** - Mongoose schema: `item`, `rate`, `quantity`, `amount`, `taxable` (bool), `taxRate` (0–100), `category` (Labour/Materials/Equipment/Subcontractor/Overhead/Other), `projectId` (ref Project)
- **`models/project.js`** - Mongoose schema: `name`, `clientId` (ref Client), `status` (draft/sent/approved/paid), `createdAt`
- **`models/client.js`** - Mongoose schema: `name`, `email`, `phone`, `address`
- **`utils/pdf-generator.js`** - PDFKit helper: `generateInvoicePdf(project, client, lines, res)` — streams a formatted invoice PDF

### Data Flow

1. User selects/creates a project via `ProjectSelectorComponent` → stored in `ProjectService.selectedProjectId`
2. User submits the line form → `BodyService` POST to `/api/lines` (with `projectId`)
3. Backend saves to MongoDB Atlas and emits Socket.io event to all clients
4. `TableComponent` receives the Socket.io event, calls `BodyService.getLines()`, re-renders table and recalculates subtotal/tax/grand total

### Socket.io Events

| Event | Direction | Trigger |
|---|---|---|
| `added` | Server → Clients | Line created |
| `updated` | Server → Clients | Line updated |
| `deleted` | Server → Clients | Line deleted |
| `projectAdded` | Server → Clients | Project created |
| `projectUpdated` | Server → Clients | Project updated/status changed |
| `projectDeleted` | Server → Clients | Project deleted |

### Deployment

Production build is served as static files from `backend/prod/`. Deployed to **AWS Elastic Beanstalk** via `backend/Procfile` (`node backend/server.js`).

**Production URL:** http://ace-contractors-prod.eba-kz2ssxnw.ap-southeast-2.elasticbeanstalk.com/

### Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@angular/core` | ~21.2.1 | Frontend framework |
| `@angular/material` | ^21.2.1 | UI components |
| `express` | ^5.2.1 | Backend framework |
| `mongoose` | ^9.2.4 | MongoDB ODM |
| `socket.io` | ^4.8.1 | Real-time events |
| `pdfkit` | ^0.15.2 | PDF invoice generation |
| `date-fns` | ^4.1.0 | Date formatting |
| `helmet` | ^8.1.0 | Security headers |
| `express-rate-limit` | ^7.5.1 | Rate limiting |

### Test Notes

- `body.service.spec.ts`: `getLines()` (no args) must call `BACKEND_URL` without query params — tests use `httpMock.expectOne(BACKEND_URL)`
- `table.component.spec.ts`: mockSocket needs both `on` and `removeListener` methods
- `lines.test.js`: bare `GET /api/lines` must return `{ lines: [...] }` with no `total/page/pageSize` fields
- Backend tests use `mongoose.Types.ObjectId` for valid IDs in PUT/DELETE
