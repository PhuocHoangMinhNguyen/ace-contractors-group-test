import { BodyService } from './services/body.service';
import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'ace-contractors-group-test';
  constructor(public bodyService: BodyService) { }
}
