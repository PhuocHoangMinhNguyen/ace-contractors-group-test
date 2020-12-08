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
    dataSource: TableDataSource;
    displayedColumns = ['item', 'rate', 'quantity', 'amount', 'action'];

    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        this.bodyService.getLines();
        this.dataSource = new TableDataSource(this.bodyService);
        this.dataSource.loadTable();
        this.dataSource.getLines().subscribe(lines => {
            this.totalAmount = lines
                .reduce((total, line) => total + line.amount, 0)
        });
    }

    onDelete(lineId: string) {
        console.log(lineId);
        this.bodyService.deleteLine(lineId);
    }
}