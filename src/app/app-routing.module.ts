import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DetailsComponent } from './report/details/details.component';
import { LayoutComponent } from './report/layout/layout.component';

const routes: Routes = [
    {
        path: 'print',
        outlet: 'print',
        component: LayoutComponent,
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