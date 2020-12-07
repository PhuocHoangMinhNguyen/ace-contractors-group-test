import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { catchError, finalize } from "rxjs/operators";
import { Line } from '../model/line.model';
import { BodyService } from './body.service';

export class TableDataSource implements DataSource<Line> {

    private linesSubject = new BehaviorSubject<Line[]>([]);

    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();

    constructor(private bodyService: BodyService) { }

    loadTable() {
        this.loadingSubject.next(true);

        this.bodyService.getLines();

        this.bodyService.getLineUpdateListener().pipe(
            catchError(() => of([])),
            finalize(() => this.loadingSubject.next(false))
        ).subscribe(lines => this.linesSubject.next(lines));
    }

    connect(collectionViewer: CollectionViewer): Observable<Line[]> {
        console.log('Connecting data source');
        return this.linesSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.linesSubject.complete();
        this.loadingSubject.complete();
    }
}