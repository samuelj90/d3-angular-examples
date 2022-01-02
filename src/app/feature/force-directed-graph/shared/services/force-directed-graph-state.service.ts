import { Injectable } from '@angular/core';
import { StateService } from 'src/app/shared/state.service';
import { ForceDirectedGraphData } from './force-directed-graph-data';
import { ForceDirectedGraphConfig } from './force-directed-graph-config';
export interface ForceDirectedGraphState {
  data: ForceDirectedGraphData | null;
  config: ForceDirectedGraphConfig | null;
}
const initialState: ForceDirectedGraphState = {
  data: null,
  config: null,
};
@Injectable({
  providedIn: 'root',
})
export class ForceDirectedGraphStateService extends StateService<ForceDirectedGraphState> {
  constructor() {
    super(initialState);
  }
}
