import * as d3 from 'd3';

// Copyright 2021-2023 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
// slightly modified for TypeScript

interface Data {
  /** an iterable of node objects (typically [{id}, …]) */
  nodes: { id: string; group: number; }[];
  /** an iterable of link objects (typically [{source, target}, …]) */
  links: { source: string; target: string; value: number; }[];
}

interface Node {
  /** given d in nodes, returns a unique identifier (string) */
  nodeId?: (d: any) => string;
  /** given d in nodes, returns an (ordinal) value for color */
  nodeGroup?: (d: any) => string;
  /** an array of ordinal values representing the node groups */
  nodeGroups?: string[];
  /** given d in nodes, a title string */
  nodeTitle?: (d: any, i: number) => string;
  /** node stroke fill (if not using a group color encoding) */
  nodeFill?: string;
  /** node stroke color */
  nodeStroke?: string;
  /** node stroke width, in pixels */
  nodeStrokeWidth?: number;
  /** node stroke opacity */
  nodeStrokeOpacity?: number;
  /** node radius, in pixels */
  nodeRadius?: number;
  /** node strength */
  nodeStrength?: number;
  /** given d in links, returns a node identifier string */
  linkSource?: (d: any) => string;
  /** given d in links, returns a node identifier string */
  linkTarget?: (d: any) => string;
  /** link stroke color */
  linkStroke?: string;
  /** link stroke opacity */
  linkStrokeOpacity?: number;
  /** given d in links, returns a stroke width in pixels */
  linkStrokeWidth?: number | ((d: any) => number);
  /** link stroke linecap */
  linkStrokeLinecap?: string;
  /** link strength */
  linkStrength?: number;
  /** an array of color strings, for the node groups */
  colors?: string[];
  /** outer width, in pixels */
  width?: number;
  /** outer height, in pixels */
  height?: number;
  /** when this promise resolves, stop the simulation */
  invalidation?: Promise<any>;
}

export function forceGraph({
  nodes: rawNodes,
  links: rawLinks,
}: Data, {
  nodeId = d => d.id,
  nodeGroup,
  nodeGroups,
  nodeTitle,
  nodeFill = "currentColor",
  nodeStroke = "#fff",
  nodeStrokeWidth = 1.5,
  nodeStrokeOpacity = 1,
  nodeRadius = 5,
  nodeStrength,
  linkSource = ({ source }) => source,
  linkTarget = ({ target }) => target,
  linkStroke = "#999",
  linkStrokeOpacity = 0.6,
  linkStrokeWidth = 1.5,
  linkStrokeLinecap = "round",
  linkStrength,
  colors = d3.schemeTableau10 as string[],
  width = 640,
  height = 400,
  invalidation
}: Node = {}) {
  function intern(value: any) {
    return value !== null && typeof value === "object" ? value.valueOf() : value;
  }

  // Compute values.
  const N = d3.map(rawNodes, nodeId).map(intern);
  const LS = d3.map(rawLinks, linkSource).map(intern);
  const LT = d3.map(rawLinks, linkTarget).map(intern);
  if (nodeTitle === undefined) nodeTitle = (_: any, i: number) => N[i];
  const T = nodeTitle == null ? null : d3.map(rawNodes, nodeTitle);
  const G = nodeGroup == null ? null : d3.map(rawNodes, nodeGroup).map(intern);
  const W = typeof linkStrokeWidth !== "function" ? null : d3.map(rawLinks, linkStrokeWidth);
  const L = typeof linkStroke !== "function" ? null : d3.map(rawLinks, linkStroke);

  // Replace the input nodes and links with mutable objects for the simulation.
  const nodes = d3.map(rawNodes, (_, i) => ({ id: N[i] as string }));
  const links = d3.map(rawLinks, (_, i) => ({ source: LS[i], target: LT[i] }));

  // Compute default domains.
  if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);

  // Construct the scales.
  const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups as any, colors);

  // Construct the forces.
  const forceNode = d3.forceManyBody();
  const forceLink = d3.forceLink(links).id(({ index: i }) => N[i as number]);
  if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
  if (linkStrength !== undefined) forceLink.strength(linkStrength);

  const simulation = d3.forceSimulation(nodes as any)
    .force("link", forceLink)
    .force("charge", forceNode)
    .force("center", d3.forceCenter())
    .on("tick", ticked);

  const svg = d3.create("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [-width / 2, -height / 2, width, height])
    .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

  const link = svg.append("g")
    .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
    .attr("stroke-opacity", linkStrokeOpacity)
    .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
    .attr("stroke-linecap", linkStrokeLinecap)
    .selectAll("line")
    .data(links)
    .join("line");

  const node = svg.append("g")
    .attr("fill", nodeFill)
    .attr("stroke", nodeStroke)
    .attr("stroke-opacity", nodeStrokeOpacity)
    .attr("stroke-width", nodeStrokeWidth)
    .selectAll("circle")
    .data(nodes)
    .join("circle")
    .attr("r", nodeRadius)
    .call(drag(simulation) as any);

  if (W) link.attr("stroke-width", ({ index: i }: any) => W[i] as any);
  if (L) link.attr("stroke", ({ index: i }: any) => L[i] as any);
  if (G && color) node.attr("fill", ({ index: i }: any) => color(G[i]) as any);
  if (T) node.append("title").text(({ index: i }: any) => T[i]);
  if (invalidation != null) invalidation.then(() => simulation.stop());

  function ticked() {
    link
      .attr("x1", d => d.source.x)
      .attr("y1", d => d.source.y)
      .attr("x2", d => d.target.x)
      .attr("y2", d => d.target.y);

    node
      .attr("cx", (d: any) => d.x)
      .attr("cy", (d: any) => d.y);
  }

  function drag(simulation: any) {
    return d3.drag()
      .on("start", function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      })
      .on("drag", function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      })
      .on("end", function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      });
  }

  return Object.assign(svg.node() as any, { scales: { color } });
}