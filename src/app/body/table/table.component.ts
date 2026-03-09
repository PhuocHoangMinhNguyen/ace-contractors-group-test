import { MatSnackBar } from '@angular/material/snack-bar';
// Table component means the component that handles
// showing lines contents and
// calculating total amount of all lines

import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild } from "@angular/core";
import { Subscription } from 'rxjs';
import { Line } from '../../model/line.model';
import { BodyService } from '../../services/body.service';
import { TableDataSource } from './../../services/table.datasource';
import { Socket } from 'ngx-socket-io';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';

@Component({
    standalone: false,
    selector: 'app-table',
    templateUrl: './table.component.html',
    styleUrls: ['./table.component.css']
})
export class TableComponent implements OnInit, OnDestroy, AfterViewInit {
    line: Line;
    totalAmount: number;
    subtotal: number = 0;
    taxTotal: number = 0;
    grandTotal: number = 0;

    // Lines data to be sent to table.component.html
    dataSource: TableDataSource;

    // Columns displayed in the table.
    displayedColumns = ['category', 'item', 'rate', 'quantity', 'amount', 'action'];
    categories = ['Labour', 'Materials', 'Equipment', 'Subcontractor', 'Overhead', 'Other'];

    editingId: string | null = null;
    editValues: { item: string; rate: number; quantity: number; taxable: boolean; taxRate: number; category: string } | null = null;

    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    private totalAmountSub: Subscription;
    private addedHandler = (addedLine: any) => {
        this.bodyService.handleLineAdded(addedLine);
        this.snackBar.open(`Added ${addedLine.item}`, '', { duration: 1000, verticalPosition: 'top' });
    };
    private updatedHandler = (updatedLine: any) => {
        this.bodyService.handleLineUpdated(updatedLine);
        this.snackBar.open(`Updated ${updatedLine.item}`, '', { duration: 1000, verticalPosition: 'top' });
    };
    private deletedHandler = (payload: { id: string; item: string | null }) => {
        this.bodyService.handleLineDeleted(payload);
        this.snackBar.open(`Deleted ${payload.item ?? 'line'}`, '', { duration: 1000, verticalPosition: 'top' });
    };

    constructor(
        private bodyService: BodyService,
        private socket: Socket,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit() {
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();

        this.totalAmountSub = this.bodyService.getLineUpdateListener().subscribe(lines => {
            this.totalAmount = lines.reduce((total, line) => total + line.amount, 0);
            this.subtotal = this.totalAmount;
            this.taxTotal = lines
                .filter(l => l.taxable)
                .reduce((sum, l) => sum + (l.amount * (l.taxRate ?? 0) / 100), 0);
            this.grandTotal = this.subtotal + this.taxTotal;
        });

        this.socket.on("added", this.addedHandler);
        this.socket.on("updated", this.updatedHandler);
        this.socket.on("deleted", this.deletedHandler);
    }

    ngAfterViewInit() {
        if (this.sort) {
            this.sort.sortChange.subscribe(() => {
                this.bodyService.getLines({
                    sortField: this.sort.active,
                    sortDir: this.sort.direction as 'asc' | 'desc'
                });
            });
        }
        if (this.paginator) {
            this.paginator.page.subscribe(() => {
                this.bodyService.getLines({
                    page: this.paginator.pageIndex + 1,
                    pageSize: this.paginator.pageSize,
                    sortField: this.sort?.active,
                    sortDir: this.sort?.direction as 'asc' | 'desc'
                });
            });
        }
    }

    ngOnDestroy() {
        this.totalAmountSub?.unsubscribe();
        this.socket.removeListener("added", this.addedHandler);
        this.socket.removeListener("updated", this.updatedHandler);
        this.socket.removeListener("deleted", this.deletedHandler);
    }

    trackById(_index: number, line: Line): string {
        return line.id;
    }

    onEdit(row: Line) {
        this.editingId = row.id;
        this.editValues = {
            item: row.item,
            rate: row.rate,
            quantity: row.quantity,
            taxable: row.taxable ?? false,
            taxRate: row.taxRate ?? 0,
            category: row.category ?? 'Other'
        };
    }

    onSave(row: Line) {
        if (!this.editValues) { return; }
        this.bodyService.updateLine(
            row.id,
            this.editValues.item,
            this.editValues.rate,
            this.editValues.quantity,
            { taxable: this.editValues.taxable, taxRate: this.editValues.taxRate, category: this.editValues.category }
        );
        this.editingId = null;
        this.editValues = null;
    }

    onCancelEdit() {
        this.editingId = null;
        this.editValues = null;
    }

    // Delete line using line id.
    onDelete(row: any) { this.bodyService.deleteLine(row.id, row.item) };

    // Print table data as a report.
    onPrint() { this.bodyService.printDocument() };
}
