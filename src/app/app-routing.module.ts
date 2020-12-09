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
            { path: 'invoice/:invoiceIds', component: DetailsComponent }
        ]
    }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }