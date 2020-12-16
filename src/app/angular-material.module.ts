// All the Angular Material Design components will be stored here 
// to be exported to app.module.ts

import { NgModule } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';

@NgModule({
    exports: [
        MatInputModule,
        MatCardModule,
        MatButtonModule,
        MatToolbarModule,
        MatTableModule,
        MatSnackBarModule,
    ],
})
export class AngularMaterialModule { }