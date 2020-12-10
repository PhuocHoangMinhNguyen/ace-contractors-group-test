// Table component means the component that handles 
// showing lines contents and
// calculating total amount of all lines

import { Component, OnInit } from "@angular/core";
import { Line } from '../../model/line.model';
import { BodyService } from '../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';

@Component({
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit {
    line: Line;
    totalAmount: Number;

    // Lines data to be sent to table.component.html
    dataSource: TableDataSource;

    // Columns displayed in the table.
    displayedColumns = ['item', 'rate', 'quantity', 'amount', 'action'];

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        this.bodyService.getLines();
        this.dataSource = new TableDataSource(this.bodyService);

        // Load table data into dataSource.
        this.dataSource.loadTable();

        // Calculate Total Amount to show in Angular Material Table Footer.
        this.dataSource.getLines().subscribe(lines => {
            this.totalAmount = lines
                .reduce((total, line) => total + line.amount, 0)
        });
    }

    // Delete line using line id.
    onDelete(lineId: string) {
        console.log(lineId);
        this.bodyService.deleteLine(lineId);
    }

    // Print table data as a report.
    onPrint() {
        this.bodyService.printDocument();
    }
}