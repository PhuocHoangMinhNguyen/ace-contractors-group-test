// Handle generating report preview to print.

import { Component, OnInit } from "@angular/core";
import { Line } from '../model/line.model';
import { BodyService } from './../services/body.service';
import { TableDataSource } from '../services/table.datasource';
import * as moment from "moment";

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
    aceLogo = 'assets/images/ace-contractors-logo.png'
    line: Line;
    totalAmount: Number;
    today = moment().format('DD/MM/YYYY, h:mm a');

    // Lines data to be sent to table.component.html
    dataSource: TableDataSource;

    // Columns displayed in the table.
    displayedColumns = ['item', 'rate', 'quantity', 'amount'];

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        // Load table data into dataSource.
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();

        // Calculate Total Amount to show in Angular Material Table Footer.
        this.bodyService.getLineUpdateListener().subscribe(lines => {
            this.totalAmount = lines
                .reduce((total, line) => total + line.amount, 0);
        });
        setTimeout(() => this.bodyService.onDataReady(), 500);
    }
}