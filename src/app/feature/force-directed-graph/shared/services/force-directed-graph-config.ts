import { ScaleOrdinal, Selection as d3Selection } from 'd3';

export interface ForceDirectedGraphConfig {
  svg: d3Selection<SVGElement, any, any, any>;
  width: number; // outer width, in pixels
  height: number; // outer height, in pixels
  linkColor: ScaleOrdinal<string, string, never>; // an array of color strings, for the links,
  nodeColor: ScaleOrdinal<string, string, never>; // an array of color strings, for the nodes,
  types: string[];
}
