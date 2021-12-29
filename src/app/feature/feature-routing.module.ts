import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeatureComponent } from './feature.component';

const routes: Routes = [
  { path: '', redirectTo: 'force-directed-graph' },
  {
    path: 'force-directed-graph',
    loadChildren: () =>
      import('./force-directed-graph/force-directed-graph.module').then(
        (m) => m.ForceDirectedGraphModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FeatureRoutingModule {}
