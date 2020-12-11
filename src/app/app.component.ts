import { BodyService } from './services/body.service';
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  constructor(public bodyService: BodyService) { }
  title = 'ace-contractors-group-test';
}
