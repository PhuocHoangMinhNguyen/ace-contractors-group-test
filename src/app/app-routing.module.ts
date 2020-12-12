// Contains all the routes of the web. In this case, 
// we only have one route leading to another window to download PDF file

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ReportComponent } from './report/report.component';
import { DetailsComponent } from './report/details/details.component';

const routes: Routes = [
    {
        path: 'print',
        outlet: 'print',
        component: ReportComponent,
        children: [
            { path: 'report', component: DetailsComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }