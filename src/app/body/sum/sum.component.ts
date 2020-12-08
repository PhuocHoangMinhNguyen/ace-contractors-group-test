import { BodyService } from './../../services/body.service';
import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-sum',
    templateUrl: './sum.component.html',
    styleUrls: ['./sum.component.css']
})
export class SumComponent implements OnInit {
    constructor(public bodyService: BodyService) { }

    ngOnInit() {
        this.bodyService.calculateSum();
    }
}