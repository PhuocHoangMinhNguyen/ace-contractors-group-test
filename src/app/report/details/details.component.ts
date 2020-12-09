import { BodyService } from './../../services/body.service';
import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from '@angular/router';


@Component({
    selector: 'app-details',
    templateUrl: './details.component.html',
    styleUrls: ['./details.component.css']
})
export class DetailsComponent implements OnInit {
    invoiceIds: string[];
    invoiceDetails: Promise<any>[];

    constructor(route: ActivatedRoute, private printService: BodyService) {
        this.invoiceIds = route.snapshot.params['invoiceIds'].split(',');
    }

    ngOnInit() {
        this.invoiceDetails = this.invoiceIds.map(id => this.getInvoiceDetails(id));
        Promise.all(this.invoiceDetails).then(() => this.printService.onDataReady());
    }

    getInvoiceDetails(invoiceId) {
        const amount = Math.floor((Math.random() * 100));
        return new Promise(resolve =>
            setTimeout(() => resolve({ amount }), 1000)
        );
    }
}