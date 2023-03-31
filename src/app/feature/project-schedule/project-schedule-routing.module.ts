import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ProjectScheduleComponent } from './project-schedule.component';

const routes: Routes = [{ path: '', component: ProjectScheduleComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProjectScheduleRoutingModule {}
