import { TestBed } from '@angular/core/testing';

import { ForceDirectedGraphStateService } from './force-directed-graph-state.service';

describe('ForceDirectedGraphStateService', () => {
  let service: ForceDirectedGraphStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForceDirectedGraphStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
