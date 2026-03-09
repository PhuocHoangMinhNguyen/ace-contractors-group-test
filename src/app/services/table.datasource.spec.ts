import { Subject } from 'rxjs';

import { TableDataSource } from './table.datasource';
import { BodyService } from './body.service';
import { Line } from '../model/line.model';

describe('TableDataSource', () => {
  let dataSource: TableDataSource;
  let linesSubject: Subject<Line[]>;
  let mockBodyService: jasmine.SpyObj<BodyService>;

  beforeEach(() => {
    linesSubject = new Subject<Line[]>();
    mockBodyService = jasmine.createSpyObj('BodyService', ['getLines', 'getLineUpdateListener']);
    mockBodyService.getLineUpdateListener.and.returnValue(linesSubject.asObservable());

    dataSource = new TableDataSource(mockBodyService);
  });

  it('connect() returns an observable', () => {
    const obs = dataSource.connect(null as any);
    expect(obs).toBeTruthy();
    expect(typeof obs.subscribe).toBe('function');
  });

  it('connect() emits the current (empty) value immediately', (done) => {
    dataSource.connect(null as any).subscribe(lines => {
      expect(lines).toEqual([]);
      done();
    });
  });

  it('loadTable() calls bodyService.getLines()', () => {
    dataSource.loadTable();
    expect(mockBodyService.getLines).toHaveBeenCalled();
  });

  it('loadTable() subscribes to getLineUpdateListener()', () => {
    dataSource.loadTable();
    expect(mockBodyService.getLineUpdateListener).toHaveBeenCalled();
  });

  it('emits lines through connect() when the subject updates', (done) => {
    const testLines: Line[] = [
      { id: '1', item: 'Labour', rate: 100, quantity: 2, amount: 200 },
    ];

    let emitCount = 0;
    dataSource.connect(null as any).subscribe(lines => {
      emitCount++;
      if (emitCount === 2) {
        // First emission is the initial empty value; second has data
        expect(lines).toEqual(testLines);
        done();
      }
    });

    dataSource.loadTable();
    linesSubject.next(testLines);
  });

  it('disconnect() completes without throwing', () => {
    expect(() => dataSource.disconnect(null as any)).not.toThrow();
  });

  it('disconnect() completes the internal subject', (done) => {
    let completed = false;
    dataSource.connect(null as any).subscribe({ complete: () => { completed = true; done(); } });
    dataSource.disconnect(null as any);
    expect(completed).toBeTrue();
  });
});
