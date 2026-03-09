import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { Subject } from 'rxjs';

import { ReportComponent } from './report.component';
import { BodyService } from '../services/body.service';
import { Line } from '../model/line.model';

describe('ReportComponent', () => {
  let component: ReportComponent;
  let fixture: ComponentFixture<ReportComponent>;
  let mockBodyService: jasmine.SpyObj<BodyService>;
  let linesSubject: Subject<Line[]>;

  beforeEach(async () => {
    linesSubject = new Subject<Line[]>();
    mockBodyService = jasmine.createSpyObj('BodyService', [
      'getLines',
      'getLineUpdateListener',
      'onDataReady',
    ]);
    mockBodyService.getLineUpdateListener.and.returnValue(linesSubject.asObservable());

    await TestBed.configureTestingModule({
      declarations: [ReportComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: BodyService, useValue: mockBodyService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('ngOnInit loads table data via getLines()', () => {
    fixture.detectChanges();
    expect(mockBodyService.getLines).toHaveBeenCalled();
  });

  it('ngOnInit calls onDataReady() after 500 ms', fakeAsync(() => {
    fixture.detectChanges();
    expect(mockBodyService.onDataReady).not.toHaveBeenCalled();
    tick(500);
    expect(mockBodyService.onDataReady).toHaveBeenCalled();
  }));

  it('ngOnInit does not call onDataReady() before 500 ms elapses', fakeAsync(() => {
    fixture.detectChanges();
    tick(499);
    expect(mockBodyService.onDataReady).not.toHaveBeenCalled();
    tick(1); // cleanup
  }));

  it('calculates totalAmount as the sum of all line amounts', () => {
    fixture.detectChanges();
    linesSubject.next([
      { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
      { id: '2', item: 'Materials', rate: 50, quantity: 4, amount: 200 },
    ]);
    expect(component.totalAmount).toBe(400);
  });

  it('totalAmount is 0 for an empty lines array', () => {
    fixture.detectChanges();
    linesSubject.next([]);
    expect(component.totalAmount).toBe(0);
  });

  it('today matches DD/MM/YYYY date format', () => {
    expect(component.today).toMatch(/^\d{2}\/\d{2}\/\d{4}/);
  });

  it('displayedColumns does not include the action column', () => {
    expect(component.displayedColumns).toEqual(['item', 'rate', 'quantity', 'amount']);
    expect(component.displayedColumns).not.toContain('action');
  });

  it('aceLogo points to the correct asset path', () => {
    expect(component.aceLogo).toBe('assets/images/ace-contractors-logo.png');
  });
});
