// Handle generating report preview to print.

import { Component, OnInit } from "@angular/core";
import { take } from 'rxjs/operators';
import { Line } from '../model/line.model';
import { BodyService } from './../services/body.service';
import { TableDataSource } from '../services/table.datasource';
import { format } from 'date-fns';

@Component({
    standalone: false,
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
    aceLogo = 'assets/images/ace-contractors-logo.png';
    line: Line;
    totalAmount: Number;
    today = format(new Date(), 'dd/MM/yyyy, h:mm a');

    // Lines data to be sent to table.component.html
    dataSource: TableDataSource;

    // Columns displayed in the table.
    displayedColumns = ['item', 'rate', 'quantity', 'amount'];

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        // Load table data into dataSource.
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();

        // Wait for data to arrive, then trigger print (no arbitrary timeout)
        this.bodyService.getLineUpdateListener().pipe(take(1)).subscribe(lines => {
            this.totalAmount = lines.reduce((total, line) => total + line.amount, 0);
            this.bodyService.onDataReady();
        });
    }
}
