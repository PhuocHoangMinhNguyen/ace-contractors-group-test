import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { MatPaginator } from "@angular/material/paginator";
import { MatSort } from "@angular/material/sort";
import { Line } from './../../model/line';
import { BodyService } from './../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, AfterViewInit {
    line: Line;

    dataSource: TableDataSource;

    displayedColumns = ['item', 'rate', 'quantity'];

    @ViewChild(MatPaginator) paginator: MatPaginator;

    @ViewChild(MatSort) sort: MatSort;

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        this.dataSource = new TableDataSource(this.bodyService);
    }

    ngAfterViewInit() {

    }
}