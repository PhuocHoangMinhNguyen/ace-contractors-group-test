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
      expect(req.request.body.rate).toBe(150);     // 100 + 50
      expect(req.request.body.quantity).toBe(3);   // 2 + 1
      expect(req.request.body.amount).toBe(450);   // 150 * 3
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
      expect(req.request.body.rate).toBe(150);
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
    it('makes a DELETE request using the item name (not the id)', () => {
      service.deleteLine('some-id', 'Labour');
      const req = httpMock.expectOne(BACKEND_URL + 'Labour');
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
});
