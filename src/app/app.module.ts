import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AngularMaterialModule } from './angular-material.module';
import { HeaderComponent } from './header/header.component';
import { LineComponent } from './body/line/line.component';
import { TableComponent } from './body/table/table.component';
import { SumComponent } from './body/sum/sum.component';
import { PrintComponent } from './body/print/print.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LineComponent,
    TableComponent,
    SumComponent,
    PrintComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    AngularMaterialModule,
    HttpClientModule,
    BrowserAnimationsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
