import { Component, OnInit, OnDestroy } from "@angular/core";
import { Subscription } from 'rxjs';
import { Line } from '../../model/line.model';
import { BodyService } from '../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, OnDestroy {
    line: Line;
    private linesSub: Subscription;

    dataSource: TableDataSource;

    displayedColumns = ['item', 'rate', 'quantity', 'amount'];

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        this.bodyService.getLines();
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();
    }

    onDelete(lineId: string) {
        this.bodyService.deleteLine(lineId);
    }

    ngOnDestroy() {

    }
}