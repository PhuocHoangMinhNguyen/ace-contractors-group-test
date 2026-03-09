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
import { ProjectSelectorComponent } from './projects/project-selector/project-selector.component';

import { environment } from '../environments/environment';
import { ServiceWorkerModule } from '@angular/service-worker';
import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
const config: SocketIoConfig = { url: environment.appUrl, options: {} };

@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    LineComponent,
    TableComponent,
    ReportComponent,
    ProjectSelectorComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    BrowserAnimationsModule,
    HttpClientModule,
    AppRoutingModule,
    AngularMaterialModule,
    SocketIoModule.forRoot(config),
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
