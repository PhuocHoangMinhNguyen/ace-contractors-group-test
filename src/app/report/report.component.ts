// Handle generating report preview to print.

import { Component, OnInit } from "@angular/core";
import { BodyService } from './../services/body.service';

@Component({
    selector: 'app-report',
    templateUrl: './report.component.html',
    styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
    constructor(private bodyService: BodyService) { }

    ngOnInit() {
        this.bodyService.onDataReady();
    }
}