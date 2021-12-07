import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProjectScheduleRoutingModule } from './project-schedule-routing.module';
import { ProjectScheduleComponent } from './project-schedule.component';
import { ProjectScheduleChartComponent } from './project-schedule-chart/project-schedule-chart.component';


@NgModule({
  declarations: [
    ProjectScheduleComponent,
    ProjectScheduleChartComponent
  ],
  imports: [
    CommonModule,
    ProjectScheduleRoutingModule
  ]
})
export class ProjectScheduleModule { }
