
export interface ForceDirectedGraphData {
  /** an iterable of node objects (typically [{id}, …]) */
  nodes: { id: string; group: number; }[];
  /** an iterable of link objects (typically [{source, target}, …]) */
  links: { source: string; target: string; value: number; }[];
}
