import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Router } from '@angular/router';

import { BodyService } from './body.service';
import { environment } from '../../environments/environment';

const BACKEND_URL = environment.apiUrl + '/lines/';

describe('BodyService', () => {
  let service: BodyService;
  let httpMock: HttpTestingController;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        BodyService,
        { provide: Router, useValue: mockRouter },
      ],
    });

    service = TestBed.inject(BodyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  // ── getLines ───────────────────────────────────────────────────────────────

  describe('getLines()', () => {
    it('makes a GET request to the correct URL', () => {
      service.getLines();
      const req = httpMock.expectOne(BACKEND_URL);
      expect(req.request.method).toBe('GET');
      req.flush({ message: 'ok', lines: [] });
    });

    it('emits mapped lines via getLineUpdateListener()', () => {
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 }],
      });

      expect(emitted).toEqual([{ id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 }]);
    });

    it('maps _id to id and omits _id from result', () => {
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: 'mongo-123', item: 'Test', rate: 10, quantity: 1, amount: 10 }],
      });

      expect(emitted[0].id).toBe('mongo-123');
      expect(emitted[0]._id).toBeUndefined();
    });

    it('emits an empty array when there are no lines', () => {
      let emitted: any[] = [{ placeholder: true }];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({ message: 'ok', lines: [] });

      expect(emitted).toEqual([]);
    });
  });

  // ── addLine ────────────────────────────────────────────────────────────────

  describe('addLine()', () => {
    it('POSTs a new line when item does not exist', () => {
      service.addLine('Labour', 100, 2);
      const req = httpMock.expectOne(BACKEND_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(
        jasmine.objectContaining({ item: 'Labour', rate: 100, quantity: 2, amount: 200 })
      );
      req.flush({ message: 'ok', lineId: 'new-id' });
    });

    it('trims whitespace from item name before POSTing', () => {
      service.addLine('  Labour  ', 100, 2);
      const req = httpMock.expectOne(BACKEND_URL);
      expect(req.request.body.item).toBe('Labour');
      req.flush({ message: 'ok', lineId: 'new-id' });
    });

    it('calculates amount as rate × quantity', () => {
      service.addLine('Materials', 50, 4);
      const req = httpMock.expectOne(BACKEND_URL);
      expect(req.request.body.amount).toBe(200);
      req.flush({ message: 'ok', lineId: 'new-id' });
    });

    it('calls updateLine (PUT) when item name already exists', () => {
      // Seed internal lines array
      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: 'existing-id', item: 'Labour', rate: 100, quantity: 2, amount: 200 }],
      });

      service.addLine('Labour', 50, 1);
      const req = httpMock.expectOne(r => r.method === 'PUT');
      expect(req.request.body.rate).toBe(100);     // rate stays fixed
      expect(req.request.body.quantity).toBe(3);   // 2 + 1
      expect(req.request.body.amount).toBe(300);   // 100 * 3
      req.flush({});
    });

    it('trims spaces before matching existing item names', () => {
      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 }],
      });

      service.addLine(' Labour ', 50, 1);
      const req = httpMock.expectOne(r => r.method === 'PUT');
      expect(req.request.body.rate).toBe(100);  // rate stays fixed; only quantity increments
      req.flush({});
    });

    it('does not match item names case-insensitively', () => {
      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 }],
      });

      // 'labour' (lowercase) should NOT match 'Labour'
      service.addLine('labour', 50, 1);
      const req = httpMock.expectOne(r => r.method === 'POST');
      expect(req.request.body.item).toBe('labour');
      req.flush({ message: 'ok', lineId: 'new-id' });
    });
  });

  // ── updateLine ─────────────────────────────────────────────────────────────

  describe('updateLine()', () => {
    it('makes a PUT request to the correct URL', () => {
      service.updateLine('line-id', 'Labour', 100, 2);
      const req = httpMock.expectOne(BACKEND_URL + 'line-id');
      expect(req.request.method).toBe('PUT');
      req.flush({});
    });

    it('sends correct body with computed amount', () => {
      service.updateLine('line-id', 'Labour', 100, 2);
      const req = httpMock.expectOne(BACKEND_URL + 'line-id');
      expect(req.request.body).toEqual(
        jasmine.objectContaining({ item: 'Labour', rate: 100, quantity: 2, amount: 200 })
      );
      req.flush({});
    });

    it('trims whitespace from item name', () => {
      service.updateLine('line-id', '  Labour  ', 100, 2);
      const req = httpMock.expectOne(BACKEND_URL + 'line-id');
      expect(req.request.body.item).toBe('Labour');
      req.flush({});
    });

    it('emits updated lines after successful PUT', () => {
      // Seed
      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [{ _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 }],
      });

      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.updateLine('1', 'Labour', 200, 3);
      httpMock.expectOne(BACKEND_URL + '1').flush({});

      expect(emitted[0].rate).toBe(200);
      expect(emitted[0].quantity).toBe(3);
      expect(emitted[0].amount).toBe(600);
    });
  });

  // ── deleteLine ─────────────────────────────────────────────────────────────

  describe('deleteLine()', () => {
    it('makes a DELETE request using the line id', () => {
      service.deleteLine('some-id', 'Labour');
      const req = httpMock.expectOne(BACKEND_URL + 'some-id');
      expect(req.request.method).toBe('DELETE');
      req.flush({});
    });

    it('removes the deleted line from local state', () => {
      service.getLines();
      httpMock.expectOne(BACKEND_URL).flush({
        message: 'ok',
        lines: [
          { _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
          { _id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
        ],
      });

      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.deleteLine('1', 'Labour');
      httpMock.expectOne(r => r.method === 'DELETE').flush({});

      expect(emitted.length).toBe(1);
      expect(emitted[0].item).toBe('Materials');
    });
  });

  // ── printDocument ──────────────────────────────────────────────────────────

  describe('printDocument()', () => {
    it('sets isPrinting to true', () => {
      service.printDocument();
      expect(service.isPrinting).toBeTrue();
    });

    it('navigates to the print outlet', () => {
      service.printDocument();
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        '/',
        { outlets: { print: ['report'] } },
      ]);
    });
  });

  // ── onDataReady ────────────────────────────────────────────────────────────

  describe('onDataReady()', () => {
    it('calls window.print after the setTimeout', fakeAsync(() => {
      spyOn(window, 'print');
      service.onDataReady();
      tick();
      expect(window.print).toHaveBeenCalled();
    }));

    it('resets isPrinting to false after the setTimeout', fakeAsync(() => {
      spyOn(window, 'print');
      service.isPrinting = true;
      service.onDataReady();
      tick();
      expect(service.isPrinting).toBeFalse();
    }));

    it('navigates to close the print outlet after the setTimeout', fakeAsync(() => {
      spyOn(window, 'print');
      service.onDataReady();
      tick();
      expect(mockRouter.navigate).toHaveBeenCalledWith([{ outlets: { print: null } }]);
    }));

    it('does not call window.print before setTimeout fires', fakeAsync(() => {
      spyOn(window, 'print');
      service.onDataReady();
      expect(window.print).not.toHaveBeenCalled();
      tick();
    }));
  });

  // ── handleLineAdded ────────────────────────────────────────────────────────

  describe('handleLineAdded()', () => {
    it('appends a new line and emits via linesUpdated', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineAdded({ _id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 });

      expect(emitted.length).toBe(2);
      expect(emitted[1]).toEqual({ id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 });
    });

    it('does not add a duplicate line (same _id)', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitCount = 0;
      service.getLineUpdateListener().subscribe(() => { emitCount++; });

      service.handleLineAdded({ _id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 });

      expect(emitCount).toBe(0);
    });

    it('maps _id to id in the stored line', () => {
      (service as any).lines = [];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineAdded({ _id: 'mongo-99', item: 'Test', rate: 10, quantity: 1, amount: 10 });

      expect(emitted[0].id).toBe('mongo-99');
      expect((emitted[0] as any)._id).toBeUndefined();
    });
  });

  // ── handleLineUpdated ──────────────────────────────────────────────────────

  describe('handleLineUpdated()', () => {
    it('replaces the matching line and emits', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
        { id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineUpdated({ _id: '1', item: 'Labour', rate: 200, quantity: 3, amount: 600 });

      expect(emitted.length).toBe(2);
      expect(emitted[0].rate).toBe(200);
      expect(emitted[0].quantity).toBe(3);
      expect(emitted[0].amount).toBe(600);
    });

    it('accepts id as either _id or id field', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineUpdated({ id: '1', item: 'Labour', rate: 300, quantity: 1, amount: 300 });

      expect(emitted[0].rate).toBe(300);
    });

    it('does nothing when the id is not found', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitCount = 0;
      service.getLineUpdateListener().subscribe(() => { emitCount++; });

      service.handleLineUpdated({ _id: 'nonexistent', item: 'X', rate: 1, quantity: 1, amount: 1 });

      expect(emitCount).toBe(0);
    });
  });

  // ── handleLineDeleted ──────────────────────────────────────────────────────

  describe('handleLineDeleted()', () => {
    it('removes the line with the matching id and emits', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
        { id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineDeleted({ id: '1', item: 'Labour' });

      expect(emitted.length).toBe(1);
      expect(emitted[0].id).toBe('2');
    });

    it('handles payload with null item (fallback when doc not found)', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineDeleted({ id: '1', item: null });

      expect(emitted.length).toBe(0);
    });

    it('does nothing when id is not in local state', () => {
      (service as any).lines = [
        { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      ];
      let emitted: any[] = [];
      service.getLineUpdateListener().subscribe(lines => { emitted = lines; });

      service.handleLineDeleted({ id: 'nonexistent', item: 'X' });

      expect(emitted.length).toBe(1);
      expect(emitted[0].id).toBe('1');
    });
  });
});
