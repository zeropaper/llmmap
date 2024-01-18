import { type ForceDirectedGraphData } from './d3/forceDirectedGraph';
export { type ForceDirectedGraphData } from './d3/forceDirectedGraph';

export function termsToGraphData(
  terms: Record<string, string[] | null>
): ForceDirectedGraphData {
  return {
    nodes: Object.keys(terms).map((term) => ({ id: term, group: 1 })),
    links: Object.entries(terms).flatMap(([source, targets]) => targets ? targets.map((target) => ({ source, target, value: 1 })) : []
    ),
  };
}
