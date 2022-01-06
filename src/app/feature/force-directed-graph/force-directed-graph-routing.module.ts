import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ForceDirectedGraphComponent } from './force-directed-graph.component';

const routes: Routes = [
  { path: '', component: ForceDirectedGraphComponent },
  { path: 'demo/:code', component: ForceDirectedGraphComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ForceDirectedGraphRoutingModule { }
