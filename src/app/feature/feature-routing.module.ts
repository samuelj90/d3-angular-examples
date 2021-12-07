import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeatureComponent } from './feature.component';

const routes: Routes = [{ path: '', redirectTo: 'project-schedule' }, { path: 'project-schedule', loadChildren: () => import('./project-schedule/project-schedule.module').then(m => m.ProjectScheduleModule) }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FeatureRoutingModule { }
