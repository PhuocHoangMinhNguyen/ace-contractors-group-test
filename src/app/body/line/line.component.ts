// Line component means the component that handles the adding line form.

import { BodyService } from './../../services/body.service';
import { Component, OnInit, OnDestroy } from "@angular/core";
import { NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ProjectService } from '../../services/project.service';

@Component({
    standalone: false,
    selector: 'app-line',
    templateUrl: './line.component.html',
    styleUrls: ['./line.component.css']
})
export class LineComponent implements OnInit, OnDestroy {
    private selectedProjectId: string | null = null;
    private projectSub: Subscription;

    constructor(private bodyService: BodyService, private projectService: ProjectService) { }

    ngOnInit() {
        this.projectSub = this.projectService.getSelectedProjectId().subscribe(id => {
            this.selectedProjectId = id;
        });
    }

    ngOnDestroy() {
        this.projectSub?.unsubscribe();
    }

    // Call addLine() function from BodyService.
    onAddLine(form: NgForm) {
        if (form.invalid) {
            return;
        }
        this.bodyService.addLine(
            form.value.item,
            form.value.rate,
            form.value.quantity,
            {
                category: form.value.category,
                taxable: form.value.taxable,
                taxRate: form.value.taxRate,
                projectId: this.selectedProjectId
            }
        );
        form.resetForm();
    }
}
