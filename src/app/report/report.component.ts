// Handle generating report preview to print.

import { BodyService } from './../services/body.service';
import { Component, OnInit } from "@angular/core";

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
    constructor(private bodyService: BodyService) { }

    // When the report is ready, show the report.
    ngOnInit() {
        this.bodyService.onDataReady();
    }
}