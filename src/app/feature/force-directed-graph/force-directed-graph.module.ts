import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ForceDirectedGraphRoutingModule } from './force-directed-graph-routing.module';
import { ForceDirectedGraphComponent } from './force-directed-graph.component';
import { SharedModule } from 'src/app/shared/shared.module';

@NgModule({
  declarations: [ForceDirectedGraphComponent],
  imports: [CommonModule, SharedModule, ForceDirectedGraphRoutingModule],
})
export class ForceDirectedGraphModule {}
