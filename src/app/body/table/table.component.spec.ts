import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';
import { Socket } from 'ngx-socket-io';
import { MatSnackBar } from '@angular/material/snack-bar';

import { TableComponent } from './table.component';
import { BodyService } from '../../services/body.service';
import { Line } from '../../model/line.model';

describe('TableComponent', () => {
  let component: TableComponent;
  let fixture: ComponentFixture<TableComponent>;
  let mockBodyService: jasmine.SpyObj<BodyService>;
  let mockSnackBar: jasmine.SpyObj<MatSnackBar>;
  let linesSubject: Subject<Line[]>;
  let socketCallbacks: { [event: string]: Function };

  const mockSocket = {
    on: (event: string, cb: Function) => { socketCallbacks[event] = cb; },
    removeListener: (_event: string, _cb: Function) => {},
  };

  beforeEach(async () => {
    linesSubject = new Subject<Line[]>();
    socketCallbacks = {};

    mockBodyService = jasmine.createSpyObj('BodyService', [
      'getLines',
      'getLineUpdateListener',
      'deleteLine',
      'printDocument',
      'handleLineAdded',
      'handleLineUpdated',
      'handleLineDeleted',
      'updateLine',
    ]);
    mockBodyService.getLineUpdateListener.and.returnValue(linesSubject.asObservable());
    mockSnackBar = jasmine.createSpyObj('MatSnackBar', ['open']);

    await TestBed.configureTestingModule({
      declarations: [TableComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: BodyService, useValue: mockBodyService },
        { provide: Socket, useValue: mockSocket },
        { provide: MatSnackBar, useValue: mockSnackBar },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges(); // triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit calls getLines() to load initial data', () => {
    expect(mockBodyService.getLines).toHaveBeenCalled();
  });

  it('displayedColumns includes all expected columns', () => {
    expect(component.displayedColumns).toEqual(['item', 'rate', 'quantity', 'amount', 'action']);
  });

  // ── socket event: "added" ──────────────────────────────────────────────────

  it('"added" socket event calls handleLineAdded with the payload', () => {
    const payload = { item: 'Labour' };
    socketCallbacks['added'](payload);
    expect(mockBodyService.handleLineAdded).toHaveBeenCalledWith(payload);
  });

  it('"added" socket event shows a snackbar with the item name', () => {
    socketCallbacks['added']({ item: 'Labour' });
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Added Labour',
      '',
      jasmine.objectContaining({ duration: 1000 })
    );
  });

  // ── socket event: "updated" ────────────────────────────────────────────────

  it('"updated" socket event calls handleLineUpdated with the payload', () => {
    const payload = { item: 'Materials' };
    socketCallbacks['updated'](payload);
    expect(mockBodyService.handleLineUpdated).toHaveBeenCalledWith(payload);
  });

  it('"updated" socket event shows a snackbar with the item name', () => {
    socketCallbacks['updated']({ item: 'Materials' });
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Updated Materials',
      '',
      jasmine.objectContaining({ duration: 1000 })
    );
  });

  // ── socket event: "deleted" ────────────────────────────────────────────────

  it('"deleted" socket event calls handleLineDeleted with the payload', () => {
    const payload = { id: 'eq-id', item: 'Equipment' };
    socketCallbacks['deleted'](payload);
    expect(mockBodyService.handleLineDeleted).toHaveBeenCalledWith(payload);
  });

  it('"deleted" socket event shows a snackbar with the item name', () => {
    socketCallbacks['deleted']({ id: 'eq-id', item: 'Equipment' });
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Deleted Equipment',
      '',
      jasmine.objectContaining({ duration: 1000 })
    );
  });

  // ── total calculation ──────────────────────────────────────────────────────

  it('calculates totalAmount as the sum of all line amounts', () => {
    const lines: Line[] = [
      { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      { id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
    ];
    linesSubject.next(lines);
    expect(component.totalAmount).toBe(400);
  });

  it('totalAmount is 0 when lines are empty', () => {
    linesSubject.next([]);
    expect(component.totalAmount).toBe(0);
  });

  // ── delegated actions ──────────────────────────────────────────────────────

  it('onDelete() calls bodyService.deleteLine with row id and item', () => {
    component.onDelete({ id: 'abc123', item: 'Labour' });
    expect(mockBodyService.deleteLine).toHaveBeenCalledWith('abc123', 'Labour');
  });

  it('onPrint() calls bodyService.printDocument()', () => {
    component.onPrint();
    expect(mockBodyService.printDocument).toHaveBeenCalled();
  });

  // ── inline editing ─────────────────────────────────────────────────────────

  it('onEdit() sets editingId and editValues from the row', () => {
    const row: Line = { id: 'abc', item: 'Labour', rate: 100, quantity: 2, amount: 200 };
    component.onEdit(row);
    expect(component.editingId).toBe('abc');
    expect(component.editValues?.item).toBe('Labour');
    expect(component.editValues?.rate).toBe(100);
  });

  it('onCancelEdit() clears editingId and editValues', () => {
    component.editingId = 'abc';
    component.editValues = { item: 'Labour', rate: 100, quantity: 2, taxable: false, taxRate: 0, category: 'Other' };
    component.onCancelEdit();
    expect(component.editingId).toBeNull();
    expect(component.editValues).toBeNull();
  });

  it('onSave() calls bodyService.updateLine and clears edit state', () => {
    const row: Line = { id: 'abc', item: 'Labour', rate: 100, quantity: 2, amount: 200 };
    component.onEdit(row);
    component.onSave(row);
    expect(mockBodyService.updateLine).toHaveBeenCalledWith('abc', 'Labour', 100, 2, jasmine.any(Object));
    expect(component.editingId).toBeNull();
  });

  it('onSave() does nothing when editValues is null', () => {
    component.editingId = null;
    component.editValues = null;
    component.onSave({ id: 'abc', item: 'Labour', rate: 100, quantity: 2, amount: 200 });
    expect(mockBodyService.updateLine).not.toHaveBeenCalled();
  });

  // ── subtotal calculation ───────────────────────────────────────────────────

  it('calculates subtotal as the sum of all line amounts', () => {
    const lines: Line[] = [
      { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      { id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
    ];
    linesSubject.next(lines);
    expect(component.subtotal).toBe(400);
  });
});
