// Data source that handles loading information to the table.

import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { Line } from '../model/line.model';
import { BodyService } from './body.service';

export class TableDataSource implements DataSource<Line> {

    private linesSubject = new BehaviorSubject<Line[]>([]);
    private linesSub: Subscription | undefined;

    constructor(private bodyService: BodyService) { }

    // Load Table data.
    loadTable() {
        this.bodyService.getLines();
        this.linesSub = this.bodyService.getLineUpdateListener().subscribe(lines => {
            this.linesSubject.next(lines);
        });
    }

    connect(collectionViewer: CollectionViewer): Observable<Line[]> {
        return this.linesSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.linesSub?.unsubscribe();
        this.linesSubject.complete();
    }
}
