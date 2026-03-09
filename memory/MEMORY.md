# Project Memory

## Stack
MEAN stack: MongoDB Atlas, Express, Angular, Node.js
Backend: `backend/` (Express + Socket.io + Mongoose)
Frontend: `src/app/` (Angular + Angular Material + ngx-socket-io)

## Package Versions (current after upgrade)
- Angular: 21.2.x
- RxJS: 7.8.x
- zone.js: 0.16.x
- TypeScript: 5.9.x (required: >=5.9 <6.1)
- mongoose: 9.x
- socket.io: 4.x
- ngx-socket-io: 4.10.x
- ESLint 9 + angular-eslint 21 (stays at ESLint 9; ESLint 10 is breaking)
- @types/node: 25.x

## Key Architectural Notes
- Angular build output → `backend/prod/` (flat, no browser/ subdir). Uses outputPath object `{ base: "backend/prod", browser: "" }` in angular.json.
- Express serves static files from `path.join(__dirname, "prod")`
- Socket.io uses `new Server(server, { cors: { origin: "*" } })` syntax (v4)
- Mongoose connect has no options object (useNewUrlParser etc removed in v6+)
- Lint builder: `@angular-eslint/builder:lint` with `eslint.config.js` (flat config)
- Removed: tslint.json, protractor, codelyzer; polyfills now in angular.json as array
- Angular 21 defaults standalone to true — NgModule components need `standalone: false` in @Component decorator
- moment import must be default import (`import moment from "moment"`) not namespace (`import * as moment`)
- Use pnpm (not npm) for installs — npm has a bug with this project

## Testing

### Backend (Jest)
- Runner: `pnpm run test:server` → runs `jest` using `jest.config.js`
- Config: `jest.config.js` at root — `testMatch: ['**/backend/**/*.test.js']`, `testTimeout: 120000`
- Packages: `jest`, `supertest`, `mongodb-memory-server` in devDependencies
- Pattern: each test file creates its own minimal Express app with mocked `io = { emit: jest.fn() }`, uses `MongoMemoryServer` — does NOT import `app.js` (avoids its `mongoose.connect()` at module load)
- Files: `backend/models/line.test.js`, `backend/routes/lines.test.js`
- First run downloads MongoDB binary (~190MB) — cached after that

### Frontend (Karma + Jasmine)
- Runner: `npm test` (interactive) or `npx ng test --watch=false --browsers=ChromeHeadless` (CI)
- Pattern: `NO_ERRORS_SCHEMA` for all component tests to suppress unknown element errors
- `LineComponent` spec needs `FormsModule` imported (template uses `#f="ngForm"` export)
- Services tested with `provideHttpClient()` + `provideHttpClientTesting()` (Angular 21 modern API, NOT `HttpClientTestingModule`)
- Mock Router: `jasmine.createSpyObj('Router', ['navigate'])` — do NOT use RouterTestingModule
- Socket mock: plain object `{ on: (event, cb) => { callbacks[event] = cb; } }` provided as `{ provide: Socket, useValue: mockSocket }`
- Files: `app.component.spec.ts` (fixed), `services/body.service.spec.ts`, `services/table.datasource.spec.ts`, `body/line/line.component.spec.ts`, `body/table/table.component.spec.ts`, `header/header.component.spec.ts`, `report/report.component.spec.ts`
- Total: 61 frontend tests, 23 backend tests

## Build System
- Builder: `@angular-devkit/build-angular:application` (esbuild-based, Angular 17+)
- Serve uses `buildTarget` (not `browserTarget`)
- polyfills: `["zone.js"]` in angular.json (no polyfills.ts file needed)
- Karma test polyfills: `["zone.js", "zone.js/testing"]`
