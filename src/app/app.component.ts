import { Component, VERSION } from '@angular/core';
import { JsonGeneratorService } from './shared/json-generator.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  data;
  constructor(private jsonGeneratorService: JsonGeneratorService);

  ngOnInit() {
    this.jsonGeneratorService
      .getProjectSchedule()
      .subscribe((data) => (this.data = data));
  }
}
