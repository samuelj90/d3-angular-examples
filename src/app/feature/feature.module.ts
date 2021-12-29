import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FeatureRoutingModule } from './feature-routing.module';
import { FeatureComponent } from './feature.component';
import { SharedModule } from '../shared/shared.module';

@NgModule({
  declarations: [FeatureComponent],
  imports: [CommonModule, SharedModule, FeatureRoutingModule],
})
export class FeatureModule {}
