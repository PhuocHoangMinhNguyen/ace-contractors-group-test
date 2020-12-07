import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Subscription } from 'rxjs';
import { Line } from '../../model/line.model';
import { BodyService } from '../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, OnDestroy, AfterViewInit {
    line: Line;
    private linesSub: Subscription;

    dataSource: TableDataSource;

    displayedColumns = ['item', 'rate', 'quantity'];

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @ViewChild(MatSort) sort: MatSort;

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

    ngAfterViewInit() {

    }
}