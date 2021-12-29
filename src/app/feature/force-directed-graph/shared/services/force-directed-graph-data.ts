export interface ForceDirectedGraphNode {
  id: string;
  name: string;
  size: string;
  sector: string;
  licenseNumber: string;
  employeeCount: string;
  state: string;
  trnNumber: string;
  healthStatus: string;
  index?: number;
  x?: number;
  y?: number;
  radius?: number;
}

export interface ForceDirectedGraphLink {
  source: string | ForceDirectedGraphNode;
  target: string | ForceDirectedGraphNode;
  type: string;
  value?: number;
  index?: number;
}

export interface ForceDirectedGraphData {
  nodes: ForceDirectedGraphNode[]; // an iterable of node objects (typically [{id}, …])
  links: ForceDirectedGraphLink[]; // an iterable of link objects (typically [{source, target}, …])
}
