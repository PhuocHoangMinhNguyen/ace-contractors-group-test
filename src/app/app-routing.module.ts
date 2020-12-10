// Contains all the routes of the web. In this case, 
// we only have one route leading to another window to download PDF file

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReportComponent } from './report/report.component';

const routes: Routes = [
    {
        path: 'print',
        outlet: 'print',
        component: ReportComponent,
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }