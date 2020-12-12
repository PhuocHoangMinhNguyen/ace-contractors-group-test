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
import { AppRoutingModule } from './app-routing.module';
import { ReportComponent } from './report/report.component';
import { DetailsComponent } from './report/details/details.component';

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LineComponent,
    TableComponent,
    ReportComponent,
    DetailsComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    AngularMaterialModule,
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
