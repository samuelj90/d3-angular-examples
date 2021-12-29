import { TestBed } from '@angular/core/testing';

import { ForceDirectedGraphService } from './force-directed-graph.service';

describe('ForceDirectedGraphService', () => {
  let service: ForceDirectedGraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ForceDirectedGraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
