import { Component, OnInit } from "@angular/core";
import { BodyService } from './../../services/body.service';

@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {

    constructor(private bodyService: BodyService) { }

    // When the report is ready, show the report.
    ngOnInit() {
        this.bodyService.onDataReady();
    }
}