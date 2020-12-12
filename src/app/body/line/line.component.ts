// Line component means the component that handles the adding line form.

import { BodyService } from './../../services/body.service';
import { Component } from "@angular/core";
import { NgForm } from '@angular/forms';

@Component({
    selector: 'app-line',
    templateUrl: './line.component.html',
    styleUrls: ['./line.component.css']
})

export class LineComponent {
    constructor(private bodyService: BodyService) { }

    // Call addLine() function from BodyService.
    onAddLine(form: NgForm) {
        if (form.invalid) {
            return;
        }
        this.bodyService.addLine(form.value.item, form.value.rate, form.value.quantity);
        form.resetForm();
    }
}