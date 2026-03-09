# ACE Contractors Group — QA Roadmap

Generated: 2026-03-09

---

## Critical (fix immediately)

### TS-001/002 — DELETE endpoint contract is broken ✅ Completed
- **Files:** `src/app/services/body.service.ts:79`, `backend/routes/lines.js`, `backend/tests/lines.test.js`
- `BodyService.deleteLine()` sends `DELETE` to `BACKEND_URL + lineId` (ObjectId), but `body.service.spec.ts` asserts it goes to `BACKEND_URL + 'Labour'` (item name). `lines.test.js` also sends item names instead of ObjectIds, causing a Mongoose `CastError` (500) instead of 200.
- **Fix:** Decide whether delete is by `_id` (current backend implementation) or item name, then align frontend, backend route, and both test files.

### TS-010 — Three TableComponent socket tests assert phantom behaviour ✅ Completed
- **File:** `src/app/body/table/table.component.spec.ts:65,82,99`
- Tests assert that socket events (`"added"`, `"updated"`, `"deleted"`) trigger `getLines()`. Production code calls `handleLineAdded()`, `handleLineUpdated()`, `handleLineDeleted()` instead. Real-time sync logic is completely untested.
- **Fix:** Update assertions to verify `handleLineAdded/Updated/Deleted` are called; add coverage for each handler's effect on local state.

### TS-018 — No `.catch()` on any Mongoose operation ✅ Completed
- **File:** `backend/routes/lines.js` (all four handlers)
- All route handlers use `.then()` with no `.catch()`. A database failure results in an unhandled promise rejection — no HTTP error response is sent and Node.js may crash.
- **Fix:** Add `.catch(next)` (or convert to `async/await` with try/catch) to every route handler.

### TS-012 — No authentication; CORS open to all origins ✅ Completed
- **Files:** `backend/app.js:38`, `backend/server.js:61`
- `Access-Control-Allow-Origin: *` and Socket.io `cors: { origin: "*" }` mean anyone who knows the Elastic Beanstalk URL can freely read, write, update, and delete all data.
- **Fix:** Restrict CORS to known origins; add at minimum an API key or session-based auth mechanism.

---

## High Priority

### TS-004 — `handleLineDeleted()` may not remove the correct line ✅ Completed
- **File:** `src/app/services/body.service.ts:110`
- Filters lines by `item !== itemName`. The backend emits `deletedLine.item` on success, but falls back to `req.params.id` (an ObjectId string) when the document is not found. Comparing item names against an ObjectId matches nothing — UI state becomes stale.
- **Fix:** Emit a consistent payload (always the `_id`), and filter local state by `_id` instead of item name.

### TS-005 — `TableDataSource.loadTable()` leaks subscriptions ✅ Completed
- **Files:** `src/app/services/table.datasource.ts:17`, `src/app/body/table/table.component.ts:51`
- Each call to `loadTable()` creates a new subscription to `getLineUpdateListener()` that is never stored or unsubscribed, causing a memory leak on repeated renders.
- **Fix:** Store the subscription and unsubscribe it in `disconnect()`.

### TS-006 — Quantity error message bound to wrong control ✅ Completed
- **File:** `src/app/body/line/line.component.html:15`
- `<mat-error *ngIf="rate.invalid">Please enter a quantity.</mat-error>` — the quantity error is only shown when the `rate` field is invalid, not when `quantity` is invalid.
- **Fix:** Change `rate.invalid` to `quantity.invalid`.

### TS-009 — ReportComponent spec tests a 500 ms timeout that does not exist ✅ Completed
- **File:** `src/app/report/report.component.spec.ts:43-55`
- The spec uses `fakeAsync` + `tick(500)` expecting `onDataReady()` to fire after a delay. The production component calls `onDataReady()` immediately via `take(1)` — there is no component-level timeout. The test either passes vacuously or fails for the wrong reason.
- **Fix:** Rewrite the spec to emit from the mock subject and assert `onDataReady()` is called synchronously.

### TS-011 — Two conflicting `package.json` files with incompatible major versions ✅ Completed
- **Files:** `package.json` (root), `backend/package.json`
- Root specifies Express 5 / Mongoose 9 / Socket.io 4. `backend/package.json` specifies Express 4 / Mongoose 5 / Socket.io 2. A fresh install from `backend/` gets a completely different and incompatible dependency tree.
- **Fix:** Remove or update `backend/package.json`; document which file is authoritative.

### TS-013 — No server-side input validation; client controls `amount` ✅ Completed
- **File:** `backend/routes/lines.js`
- `item`, `rate`, `quantity`, and `amount` are accepted and stored verbatim. A client can send `amount: 999999999` regardless of rate and quantity. No length caps, no negative-value guards, no sanitisation.
- **Fix:** Add server-side validation (e.g., `express-validator`); recalculate `amount = rate * quantity` server-side rather than trusting the client.

### TS-015/016 — No security headers; Socket.io CORS open to all ✅ Completed
- **Files:** `backend/app.js`, `backend/server.js:61`
- No `helmet` or equivalent. Missing `X-Content-Type-Options`, `X-Frame-Options`, `Content-Security-Policy`, `Strict-Transport-Security`. App is vulnerable to clickjacking and MIME sniffing.
- **Fix:** Add `helmet` middleware; restrict Socket.io CORS to known origins.

### TS-017 — No rate limiting on any endpoint ✅ Completed
- **File:** `backend/routes/lines.js`
- `POST /api/lines` can be flooded to exhaust MongoDB storage or degrade service.
- **Fix:** Add rate limiting middleware (e.g., `express-rate-limit`).

### TS-019 — App starts and serves requests when MongoDB is unreachable ✅ Completed
- **File:** `backend/app.js:17-18`
- Connection failure is only logged; the server starts anyway. All subsequent API calls fail with unhandled errors.
- **Fix:** Exit the process (or refuse to bind) when the initial DB connection fails.

### TS-020 — All BodyService HTTP calls silently swallow errors ✅ Completed
- **File:** `src/app/services/body.service.ts` (all subscribe calls)
- No error callbacks on any HTTP observable subscription. Network or server errors are invisible to the user; local state may diverge from server state.
- **Fix:** Add error callbacks to every subscription; display user-facing error notifications.

### TS-025/026 — No backend tests for error paths; no tests for handle* methods ✅ Completed
- **Files:** `backend/tests/lines.test.js`, `src/app/services/body.service.spec.ts`
- Zero tests for: missing required fields, malformed IDs, DB errors, malformed JSON. `handleLineAdded`, `handleLineUpdated`, `handleLineDeleted` have no unit tests despite being the core of real-time sync.
- **Fix:** Add negative-path backend tests; add unit tests for each `handle*` method including the ObjectId-fallback edge case in `handleLineDeleted`.

### RISK-007 — `addLine()` accumulates rate on duplicate items (possible business logic bug) ✅ Completed
- **File:** `src/app/services/body.service.ts:51`
- Adding "Labour" at rate 100 twice results in `rate: 200, quantity: 2, amount: 400` instead of `rate: 100, quantity: 2, amount: 200`. Whether accumulating the rate is intentional is undocumented.
- **Fix:** Confirm intended business logic with product owner; if rate should stay fixed, change accumulation to only increment quantity.

---

## Medium Priority

### TS-003 — `onError` in server.js references undefined `addr` ✅ Completed
- **File:** `backend/server.js:33`
- `addr` is defined inside `onListening()` but referenced in `onError()`. Error message always reads `"port undefined"` for named pipes.
- **Fix:** Derive `addr` from the error object or the server's address inside `onError`.

### TS-007 — `minlength` validator has no effect on number inputs ✅ Completed
- **File:** `src/app/body/line/line.component.html:8,13`
- `minlength="3"` on `type="number"` fields performs string-length validation which is meaningless for numeric inputs.
- **Fix:** Replace with Angular `Validators.min()` if a minimum numeric value is intended.

### TS-021 — PUT with non-existent ID returns 200 instead of 404 ✅ Completed
- **File:** `backend/routes/lines.js:41`
- `updateOne()` result is not checked for `matchedCount`. A PUT for a missing document returns `"Update successful!"` with status 200.
- **Fix:** Check `result.matchedCount`; return 404 if zero.

### TS-023 — Catch-all route serves `index.html` with no error callback ✅ Completed
- **File:** `backend/app.js:52-54`
- If the production build is missing, `res.sendFile()` throws an unhandled error.
- **Fix:** Add an error callback to `sendFile` to return a proper 500 response.

### TS-024 — Report component has no error path for failed data fetch
- **File:** `src/app/report/report.component.ts`
- If `getLines()` fails, `take(1)` never fires, `onDataReady()` is never called, and the print outlet is never closed. User is left in a broken state.
- **Fix:** Add error handling and a timeout fallback; close the print outlet on failure.

### TS-036 — CORS middleware registered after static middleware ✅ Completed
- **File:** `backend/app.js`
- Static file responses do not include CORS headers. CORS middleware must be registered before all route and static middleware.
- **Fix:** Move CORS middleware to the top of the middleware chain.

### TS-041 — `backend/package.json` is a stale artefact ✅ Completed
- **File:** `backend/package.json`
- No clear purpose under the current setup where root `node_modules` is shared. Creates maintenance confusion and version hazard (see TS-011).
- **Fix:** Remove it or make it the single authoritative dependency file for the backend.

---

## Low Priority / Code Quality

| # | Issue | File |
|---|---|---|
| TS-022 | DELETE returns 200 even when document not found | `backend/routes/lines.js:60` |
| TS-027 | `ngOnDestroy` socket listener removal is never tested | `table.component.spec.ts` |
| TS-028 | `totalAmountSub` unsubscribe in `ngOnDestroy` is never tested | `table.component.ts` |
| TS-031 | No working end-to-end tests | `e2e/` |
| TS-032 | No test verifies server rejects inconsistent `amount` vs `rate * quantity` | `lines.test.js` |
| TS-034 | `Line.find()` has no projection, sort, or pagination | `routes/lines.js:49` | ✅ Server-side pagination/sort/filter added |
| TS-037 | `console.log('Connecting data source')` left in production code | `table.datasource.ts:23` |
| TS-038 | `deleteLine(lineId, item)` — `item` param is unused | `body.service.ts:79` |
| TS-039 | `id: null` assigned to `string`-typed field in `Line` model | `body.service.ts:55` |
| TS-040 | `totalAmount: Number` (wrapper object) instead of primitive `number` | `report.component.ts:19` |
| TS-008 | Case-sensitive duplicate detection may be a UX defect | `body.service.ts:48` |
| TS-014 | Production Elastic Beanstalk URL committed to source control | `environment.prod.ts` |
| TS-030 | `normalizePort` in `server.js` has no unit tests | `backend/server.js` |
| TS-035 | Service worker caches app shell eagerly but scripts lazily | `ngsw-config.json` |
| RISK-008 | `moment.js` is in maintenance-only mode; consider replacement | `report.component.ts` | ✅ Replaced with `date-fns` |

---

## Feature Roadmap (2026-03-09)

### Implemented

| Feature | Status | Key Files |
|---------|--------|-----------|
| Inline Table Editing (edit CRUD) | ✅ Done | `table.component.ts/html`, `body.service.ts` |
| Server-Side Pagination / Sort / Filter | ✅ Done | `backend/routes/lines.js`, `table.component.ts`, `body.service.ts` |
| Replace Moment.js → date-fns | ✅ Done | `report.component.ts`, `package.json` |
| Tax Configuration (`taxable`, `taxRate` fields) | ✅ Done | `backend/models/line.js`, `line.component.html`, `table.component.html` |
| Cost Code Categorisation (`category` field) | ✅ Done | `backend/models/line.js`, `line.component.html` |
| Multi-Project Support | ✅ Done | `backend/models/project.js`, `backend/routes/projects.js`, `project-selector.component.*`, `project.service.ts` |
| Client / Customer Management | ✅ Done | `backend/models/client.js`, `backend/routes/clients.js`, `client.service.ts` |
| PDF Invoice Export | ✅ Done | `backend/utils/pdf-generator.js`, `backend/routes/projects.js` (GET `/:id/invoice.pdf`) |
| Estimate-to-Invoice Workflow (status transitions) | ✅ Done | `project-selector.component.html` (Draft → Sent → Approved → Paid buttons) |
| Subtotal / Tax / Grand Total footer | ✅ Done | `table.component.ts/html` |

### Deferred

| Feature | Priority | Notes |
|---------|----------|-------|
| JWT Authentication | High | Requires full auth module (`passport-jwt`, `bcrypt`, Angular AuthGuard, interceptor) |
| Optimistic UI Updates with Rollback | Medium | Partially done (local state updated before Socket event); rollback on error not yet wired |
| Offline PWA Action Queue | Medium | `ngsw-config.json` scaffolded; needs Dexie.js + Navigator.onLine integration |
| Budget vs. Actuals Dashboard | High | Needs `estimate`/`actual` line type, MongoDB aggregation, Chart.js |
| Change Order Tracking | High | Needs `ChangeOrder` schema + UI |
| Email Invoice Delivery | Medium | Needs Nodemailer/SendGrid + `POST /api/projects/:id/send` |
