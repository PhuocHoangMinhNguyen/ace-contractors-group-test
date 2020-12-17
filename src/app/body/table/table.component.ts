import { MatSnackBar } from '@angular/material/snack-bar';
// Table component means the component that handles 
// showing lines contents and
// calculating total amount of all lines

import { Component, OnInit } from "@angular/core";
import { Line } from '../../model/line.model';
import { BodyService } from '../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';
import { Socket } from 'ngx-socket-io';

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

    constructor(
        private bodyService: BodyService,
        private socket: Socket,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.getTableData();
        this.socket.on("added", (addedLine) => {
            this.getTableData();
            this.snackBar.open(`Added ${addedLine.item}`, '', {
                duration: 1000,
                verticalPosition: 'top'
            });
        });
        this.socket.on("updated", (updatedLine) => {
            this.getTableData();
            this.snackBar.open(`Updated ${updatedLine.item}`, '', {
                duration: 1000,
                verticalPosition: 'top'
            });
        });
        this.socket.on("deleted", (deletedItem) => {
            this.getTableData();
            this.snackBar.open(`Deleted ${deletedItem}`, '', {
                duration: 1000,
                verticalPosition: 'top'
            });
        });
    }

    getTableData() {
        // Load table data into dataSource.
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();

        // Calculate Total Amount to show in Angular Material Table Footer.
        this.bodyService.getLineUpdateListener().subscribe(lines => {
            this.totalAmount = lines
                .reduce((total, line) => total + line.amount, 0)
        });
    }

    // Delete line using line id.
    onDelete(row: any) { this.bodyService.deleteLine(row.id, row.item) };

    // Print table data as a report.
    onPrint() { this.bodyService.printDocument() };
}