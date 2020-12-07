import { CollectionViewer, DataSource } from '@angular/cdk/collections';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { Line } from './../model/line';
import { BodyService } from './body.service';

export class TableDataSource implements DataSource<Line> {

    private linesSubject = new BehaviorSubject<Line[]>([]);

    private loadingSubject = new BehaviorSubject<boolean>(false);

    public loading$ = this.loadingSubject.asObservable();

    constructor(private bodyService: BodyService) { }

    connect(collectionViewer: CollectionViewer): Observable<Line[]> {
        console.log('Connecting data source');
        return this.linesSubject.asObservable();
    }

    disconnect(collectionViewer: CollectionViewer): void {
        this.linesSubject.complete();
        this.loadingSubject.complete();
    }
}