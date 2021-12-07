import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs/operators';
import { ProjectScheduleData } from './shared/project-schedule-data';
import { ProjectScheduleService } from './shared/project-schedule.service';

@Component({
  selector: 'app-project-schedule',
  templateUrl: './project-schedule.component.html',
  styleUrls: ['./project-schedule.component.scss']
})
export class ProjectScheduleComponent implements OnInit {

  data: ProjectScheduleData[] | undefined;
  constructor(private projectScheduleService: ProjectScheduleService) { }

  ngOnInit() {
    this.projectScheduleService
      .getProjectSchedule()
      .subscribe({
        next: (response: ProjectScheduleData[]) => {
          this.data = response;
        }
      });
  }

}
