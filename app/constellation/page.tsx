"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { getThoughts, formatDate, type Thought } from "@/lib/storage";

type LayoutType = "force" | "circular" | "hierarchical";

// --- Tag-centric data model ---

interface TagNode {
  tag: string;
  thoughts: Thought[];
  companionTags: string[];
  coOccurrences: Record<string, number>;
  isBridge: boolean;
  alwaysPaired: boolean;
  recentBias: number;
}

interface TagNodeDatum extends d3.SimulationNodeDatum {
  id: string;
  tagNode: TagNode;
  shapeIndex: number;
  color: string;
  baseScale: number;
  connectionCount: number;
}

interface TagLinkDatum {
  source: string | TagNodeDatum;
  target: string | TagNodeDatum;
  strength: number;
  sharedThoughts: Thought[];
}

// --- 6 botanical SVG path shapes ---

const SHAPE_LEAF_CLUSTER = `
M0,-18 C-6,-16 -12,-8 -10,0 C-8,6 -4,10 0,8 C4,10 8,6 10,0 C12,-8 6,-16 0,-18Z
M-8,-6 C-14,-4 -18,2 -14,8 C-12,12 -6,14 -2,10
M8,-6 C14,-4 18,2 14,8 C12,12 6,14 2,10
`;

const SHAPE_BUD = `
M0,16 C0,16 -1,4 -1,0 C-1,-4 0,-6 0,-6
C-6,-8 -10,-14 -6,-18 C-2,-22 4,-20 6,-16 C8,-12 6,-6 0,-6Z
M-1,2 C-6,4 -10,2 -12,-2
`;

const SHAPE_PETAL = `
M0,-18 C8,-16 16,-6 14,2 C12,10 6,18 0,18
C-6,18 -12,10 -14,2 C-16,-6 -10,-16 -4,-18
C-2,-18.5 2,-18.5 0,-18Z
`;

const SHAPE_FERN = `
M0,18 C0,18 -2,6 -1,0 C0,-6 1,-12 2,-18
M2,-14 C6,-16 10,-12 8,-8
M1,-8 C-4,-10 -8,-6 -6,-2
M1,-2 C5,-3 9,1 7,5
M0,4 C-4,3 -7,7 -5,10
M0,10 C3,9 6,13 4,16
`;

const SHAPE_BERRY = `
M-6,-6 A6,6 0 1,1 -6,-5.99 Z
M6,-6 A6,6 0 1,1 6,-5.99 Z
M0,4 A7,7 0 1,1 0,4.01 Z
`;

const SHAPE_SEEDPOD = `
M0,-20 C4,-16 8,-8 8,0 C8,8 4,16 0,20
C-4,16 -8,8 -8,0 C-8,-8 -4,-16 0,-20Z
M0,-12 C2,-8 2,0 0,4
`;

const BOTANICAL_SHAPES = [
  SHAPE_LEAF_CLUSTER, SHAPE_BUD, SHAPE_PETAL,
  SHAPE_FERN, SHAPE_BERRY, SHAPE_SEEDPOD,
];

const PALETTE = ["#C9A0A0", "#8FAF9A", "#A09AC9", "#C9B89A", "#9ABFC9", "#C9A8B8"];

function getNodeColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}

function getScale(thoughtCount: number): number {
  return Math.min(0.7 + thoughtCount * 0.14, 1.4);
}

// --- Build tag graph ---

function buildTagGraph(thoughts: Thought[]): { tagNodes: TagNode[]; tagLinks: TagLinkDatum[] } {
  const tagMap: Record<string, Thought[]> = {};
  thoughts.forEach((t) => {
    t.tags.forEach((tag) => {
      if (!tagMap[tag]) tagMap[tag] = [];
      tagMap[tag].push(t);
    });
  });

  const coOccMap: Record<string, Record<string, number>> = {};
  const coOccThoughts: Record<string, Thought[]> = {};
  const allTags = Object.keys(tagMap);

  allTags.forEach((tag) => { coOccMap[tag] = {}; });

  thoughts.forEach((t) => {
    const tags = t.tags;
    for (let i = 0; i < tags.length; i++) {
      for (let j = i + 1; j < tags.length; j++) {
        const a = tags[i], b = tags[j];
        coOccMap[a][b] = (coOccMap[a][b] || 0) + 1;
        coOccMap[b][a] = (coOccMap[b][a] || 0) + 1;
        const key = [a, b].sort().join("|");
        if (!coOccThoughts[key]) coOccThoughts[key] = [];
        coOccThoughts[key].push(t);
      }
    }
  });

  function isBridge(tag: string): boolean {
    const companions = Object.keys(coOccMap[tag]).filter((t) => coOccMap[tag][t] > 0);
    if (companions.length < 2) return false;
    for (let i = 0; i < companions.length; i++) {
      for (let j = i + 1; j < companions.length; j++) {
        if ((coOccMap[companions[i]]?.[companions[j]] || 0) === 0) return true;
      }
    }
    return false;
  }

  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  const tagNodes: TagNode[] = allTags.map((tag) => {
    const tagThoughts = tagMap[tag];
    const companions = Object.keys(coOccMap[tag]).filter((t) => coOccMap[tag][t] > 0);
    const recentCount = tagThoughts.filter((t) => now - new Date(t.createdAt).getTime() < threeDays).length;
    return {
      tag,
      thoughts: tagThoughts,
      companionTags: companions,
      coOccurrences: coOccMap[tag],
      isBridge: isBridge(tag),
      alwaysPaired: tagThoughts.every((t) => t.tags.length > 1),
      recentBias: tagThoughts.length > 0 ? recentCount / tagThoughts.length : 0,
    };
  });

  const tagLinks: TagLinkDatum[] = [];
  const seen = new Set<string>();
  allTags.forEach((a) => {
    Object.keys(coOccMap[a]).forEach((b) => {
      const key = [a, b].sort().join("|");
      if (!seen.has(key) && coOccMap[a][b] > 0) {
        seen.add(key);
        tagLinks.push({ source: a, target: b, strength: coOccMap[a][b], sharedThoughts: coOccThoughts[key] || [] });
      }
    });
  });

  return { tagNodes, tagLinks };
}

// --- Insight generators ---

function generateInsight(tagNode: TagNode, allTagNodes: TagNode[]): string[] {
  const insights: string[] = [];
  const { tag, thoughts, companionTags, coOccurrences, isBridge, alwaysPaired, recentBias } = tagNode;

  if (companionTags.length > 0) {
    const strongest = companionTags.reduce((a, b) => (coOccurrences[a] || 0) >= (coOccurrences[b] || 0) ? a : b);
    const count = coOccurrences[strongest];
    if (count > 1) {
      insights.push(`When you think about ${tag}, you almost always think about ${strongest} \u2014 they\u2019re inseparable in your mind.`);
    } else if (companionTags.length === 1) {
      insights.push(`${tag} and ${strongest} have appeared together \u2014 a connection worth watching as it grows.`);
    } else {
      insights.push(`${tag} draws in ${companionTags.join(", ")} \u2014 it\u2019s a theme that never travels alone.`);
    }
  }

  if (isBridge) {
    const bridged: string[] = [];
    for (let i = 0; i < companionTags.length && bridged.length < 2; i++) {
      for (let j = i + 1; j < companionTags.length && bridged.length < 2; j++) {
        const aNode = allTagNodes.find((n) => n.tag === companionTags[i]);
        if (aNode && (aNode.coOccurrences[companionTags[j]] || 0) === 0) {
          bridged.push(companionTags[i], companionTags[j]);
        }
      }
    }
    if (bridged.length >= 2) {
      insights.push(`${tag} is a bridge \u2014 it\u2019s the only idea connecting ${bridged[0]} with ${bridged[1]}. Without it, those themes would never touch.`);
    }
  }

  if (alwaysPaired && companionTags.length > 0) {
    insights.push(`Every time you write about ${tag}, other ideas come with it. You never think about it in isolation.`);
  } else if (!alwaysPaired && thoughts.length > 1) {
    insights.push(`Sometimes ${tag} stands on its own \u2014 a thought you\u2019re comfortable holding by itself.`);
  }

  if (thoughts.length >= 2) {
    const sorted = [...thoughts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const daysBetween = Math.round((new Date(sorted[sorted.length - 1].createdAt).getTime() - new Date(sorted[0].createdAt).getTime()) / (24 * 60 * 60 * 1000));
    if (daysBetween === 0) {
      insights.push(`All your thoughts on ${tag} bloomed on the same day \u2014 a burst of focused thinking.`);
    } else {
      insights.push(`You first explored ${tag} ${formatDate(sorted[0].createdAt)}. You returned ${daysBetween} day${daysBetween !== 1 ? "s" : ""} later \u2014 a thread you keep pulling.`);
    }
  }

  if (recentBias >= 0.6 && thoughts.length >= 2) {
    insights.push(`You\u2019ve been thinking about ${tag} more recently \u2014 it\u2019s gaining momentum in your garden.`);
  } else if (recentBias === 0 && thoughts.length >= 2) {
    insights.push(`${tag} has been quiet lately \u2014 a dormant seed that may bloom again.`);
  }

  if (companionTags.length >= 3) {
    insights.push(`${tag} touches ${companionTags.length} other themes \u2014 one of the most interconnected ideas in your garden.`);
  } else if (companionTags.length === 0) {
    insights.push(`${tag} lives quietly at the edge, connected to nothing else yet. Isolated ideas often become the seeds of new directions.`);
  }

  return insights;
}

function generateSynthesis(tagNode: TagNode): string {
  const { tag, thoughts, companionTags, coOccurrences, isBridge, recentBias } = tagNode;
  const parts: string[] = [];
  parts.push(`Your thoughts on ${tag} show that it\u2019s ${thoughts.length === 1 ? "a seed just planted" : thoughts.length <= 3 ? "a growing presence" : "a deeply rooted theme"} in your thinking`);
  if (companionTags.length > 0) {
    const strongest = companionTags.reduce((a, b) => (coOccurrences[a] || 0) >= (coOccurrences[b] || 0) ? a : b);
    parts[0] += `, most closely tied to ${strongest}`;
  }
  parts[0] += ".";
  if (isBridge) parts.push("It plays a bridging role \u2014 connecting ideas that would otherwise remain separate.");
  if (recentBias >= 0.6 && thoughts.length >= 2) parts.push("It\u2019s gaining momentum, drawing more of your attention lately.");
  return parts.join(" ");
}

// --- Mini radial graph component for the panel ---

function MiniRadialGraph({ tagNode, allTagNodes, onSelectTag }: {
  tagNode: TagNode;
  allTagNodes: TagNode[];
  onSelectTag: (node: TagNode) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const w = 316, h = 160;
    const cx = w / 2, cy = h / 2;
    const companions = tagNode.companionTags;
    const maxCoOcc = Math.max(1, ...companions.map((c) => tagNode.coOccurrences[c] || 1));

    // Draw connections from center to companions
    const angleStep = companions.length > 0 ? Math.PI / Math.max(companions.length - 1, 1) : 0;
    const radius = 55;

    const companionPositions = companions.map((c, i) => {
      // Spread companions in an arc above and around
      const angle = companions.length === 1
        ? -Math.PI / 2
        : -Math.PI + (i * Math.PI * 2) / companions.length - Math.PI / 2;
      const r = radius;
      return {
        tag: c,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        strength: tagNode.coOccurrences[c] || 1,
      };
    });

    // Curved links
    companionPositions.forEach((cp) => {
      const mx = (cx + cp.x) / 2;
      const my = (cy + cp.y) / 2;
      const dx = cp.x - cx;
      const dy = cp.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = dist * 0.15;
      const ctrlX = mx + (-dy / dist) * offset;
      const ctrlY = my + (dx / dist) * offset;
      const opacity = 0.15 + (cp.strength / maxCoOcc) * 0.3;
      const width = 0.8 + (cp.strength / maxCoOcc) * 1.5;

      svg.append("path")
        .attr("d", `M${cx},${cy} Q${ctrlX},${ctrlY} ${cp.x},${cp.y}`)
        .attr("fill", "none")
        .attr("stroke", "#C9A0A0")
        .attr("stroke-width", width)
        .attr("stroke-opacity", opacity)
        .attr("stroke-linecap", "round");
    });

    // Center node (the selected tag)
    const centerIdx = allTagNodes.findIndex((n) => n.tag === tagNode.tag);
    const centerColor = getNodeColor(centerIdx >= 0 ? centerIdx : 0);

    svg.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", 14)
      .attr("fill", centerColor).attr("opacity", 0.15)
      .attr("filter", "url(#miniGlow)");
    svg.append("circle")
      .attr("cx", cx).attr("cy", cy).attr("r", 8)
      .attr("fill", centerColor).attr("opacity", 0.85);
    svg.append("text")
      .attr("x", cx).attr("y", cy + 22)
      .attr("text-anchor", "middle")
      .attr("font-family", "'Cormorant Garamond', serif")
      .attr("font-style", "italic")
      .attr("font-size", "12px")
      .attr("fill", "#6B6B6B")
      .text(tagNode.tag);

    // Companion nodes
    companionPositions.forEach((cp) => {
      const idx = allTagNodes.findIndex((n) => n.tag === cp.tag);
      const color = getNodeColor(idx >= 0 ? idx : 0);
      const nodeSize = 4 + (cp.strength / maxCoOcc) * 4;

      svg.append("circle")
        .attr("cx", cp.x).attr("cy", cp.y).attr("r", nodeSize + 4)
        .attr("fill", color).attr("opacity", 0.1);
      svg.append("circle")
        .attr("cx", cp.x).attr("cy", cp.y).attr("r", nodeSize)
        .attr("fill", color).attr("opacity", 0.75)
        .style("cursor", "pointer")
        .on("click", () => {
          const node = allTagNodes.find((n) => n.tag === cp.tag);
          if (node) onSelectTag(node);
        });
      svg.append("text")
        .attr("x", cp.x).attr("y", cp.y + nodeSize + 13)
        .attr("text-anchor", "middle")
        .attr("font-family", "'Cormorant Garamond', serif")
        .attr("font-style", "italic")
        .attr("font-size", "12px")
        .attr("fill", "#6B6B6B")
        .style("cursor", "pointer")
        .text(cp.tag)
        .on("click", () => {
          const node = allTagNodes.find((n) => n.tag === cp.tag);
          if (node) onSelectTag(node);
        });
    });

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "miniGlow").attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
    filter.append("feGaussianBlur").attr("stdDeviation", "3");

  }, [tagNode, allTagNodes, onSelectTag]);

  return (
    <svg ref={svgRef} width={316} height={160} className="mx-auto" />
  );
}

// --- Timeline component ---

function ThoughtTimeline({ thoughts, tagColor }: { thoughts: Thought[]; tagColor: string }) {
  if (thoughts.length < 2) return null;

  const sorted = [...thoughts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const earliest = new Date(sorted[0].createdAt).getTime();
  const latest = new Date(sorted[sorted.length - 1].createdAt).getTime();
  const range = latest - earliest || 1;

  return (
    <div className="px-8 pb-5">
      <h3
        className="font-sans uppercase mb-3"
        style={{ fontSize: "12px", letterSpacing: "0.08em", color: "#6B6B6B" }}
      >
        Timeline
      </h3>
      <div className="relative h-[40px]">
        {/* Track line */}
        <div
          className="absolute top-[16px] left-0 right-0"
          style={{ height: "1px", background: "rgba(0,0,0,0.08)" }}
        />
        {/* Dots */}
        {sorted.map((t, i) => {
          const pct = range > 0 ? ((new Date(t.createdAt).getTime() - earliest) / range) * 100 : 50;
          return (
            <div
              key={t.id}
              className="absolute"
              style={{ left: `${Math.max(4, Math.min(96, pct))}%`, top: "10px", transform: "translateX(-50%)" }}
            >
              <div
                style={{
                  width: "12px",
                  height: "12px",
                  borderRadius: "50%",
                  background: tagColor,
                  opacity: 0.6 + (i / sorted.length) * 0.4,
                  boxShadow: `0 0 8px ${tagColor}33`,
                }}
              />
              <p className="font-sans text-[12px] text-[#737373] mt-1 text-center whitespace-nowrap" style={{ transform: "translateX(-25%)" }}>
                {formatDate(t.createdAt)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// === Main component ===

export default function ConstellationPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [selectedTag, setSelectedTag] = useState<TagNode | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [threshold, setThreshold] = useState(0);
  const [layout, setLayout] = useState<LayoutType>("force");
  const simulationRef = useRef<d3.Simulation<TagNodeDatum, TagLinkDatum> | null>(null);
  const [thoughtsExist, setThoughtsExist] = useState(true);
  const [allTagNodes, setAllTagNodes] = useState<TagNode[]>([]);

  const selectTag = useCallback((tagNode: TagNode | null) => {
    setSelectedTag(tagNode);
    setPanelOpen(tagNode !== null);
    // Scroll panel to top when changing selection
    setTimeout(() => {
      if (panelRef.current) panelRef.current.scrollTop = 0;
    }, 50);
  }, []);

  const buildGraph = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;

    const thoughts = getThoughts().filter((t) => !t.archived);
    setThoughtsExist(thoughts.length > 0 && thoughts.some((t) => t.tags.length > 0));
    if (thoughts.length === 0) return;

    const { tagNodes, tagLinks } = buildTagGraph(thoughts);
    setAllTagNodes(tagNodes);

    if (tagNodes.length === 0) { setThoughtsExist(false); return; }

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    d3.select(svgRef.current).selectAll("*").remove();
    const svg = d3.select(svgRef.current).attr("width", width).attr("height", height);

    // Glow filter
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "softGlow").attr("x", "-80%").attr("y", "-80%").attr("width", "260%").attr("height", "260%");
    filter.append("feGaussianBlur").attr("stdDeviation", "6").attr("result", "blur");
    filter.append("feComposite").attr("in", "SourceGraphic").attr("in2", "blur").attr("operator", "over");

    // Filter links by threshold
    const filteredLinks = tagLinks.filter((l) => l.strength > threshold);

    // Build a node lookup map for resolving link references
    const nodeMap: Record<string, TagNodeDatum> = {};

    const connectionCounts: Record<string, number> = {};
    tagNodes.forEach((tn) => { connectionCounts[tn.tag] = 0; });
    filteredLinks.forEach((l) => {
      const src = typeof l.source === "string" ? l.source : l.source.id;
      const tgt = typeof l.target === "string" ? l.target : l.target.id;
      connectionCounts[src] = (connectionCounts[src] || 0) + 1;
      connectionCounts[tgt] = (connectionCounts[tgt] || 0) + 1;
    });

    const nodes: TagNodeDatum[] = tagNodes.map((tn, i) => {
      const node: TagNodeDatum = {
        id: tn.tag,
        tagNode: tn,
        shapeIndex: i % BOTANICAL_SHAPES.length,
        color: getNodeColor(i),
        baseScale: getScale(tn.thoughts.length),
        connectionCount: connectionCounts[tn.tag] || 0,
        x: width / 2 + (Math.random() - 0.5) * 300,
        y: height / 2 + (Math.random() - 0.5) * 300,
      };
      nodeMap[tn.tag] = node;
      return node;
    });

    // Resolve link source/target to node objects (needed for circular/hierarchical)
    filteredLinks.forEach((l) => {
      if (typeof l.source === "string") l.source = nodeMap[l.source] || l.source;
      if (typeof l.target === "string") l.target = nodeMap[l.target] || l.target;
    });

    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");

    // Curved bezier connections
    const linkEl = linkGroup
      .selectAll("path")
      .data(filteredLinks)
      .enter()
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#C9A0A0")
      .attr("stroke-width", (d) => Math.min(0.8 + d.strength * 0.6, 2.5))
      .attr("stroke-opacity", (d) => Math.min(0.15 + d.strength * 0.08, 0.4))
      .attr("stroke-linecap", "round");

    function getLinkPath(d: TagLinkDatum): string {
      const s = d.source as TagNodeDatum;
      const t = d.target as TagNodeDatum;
      const sx = s.x ?? 0, sy = s.y ?? 0;
      const tx = t.x ?? 0, ty = t.y ?? 0;
      const mx = (sx + tx) / 2, my = (sy + ty) / 2;
      const dx = tx - sx, dy = ty - sy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const offset = dist * 0.2;
      const cx = mx + (-dy / dist) * offset;
      const cy = my + (dx / dist) * offset;
      return `M${sx},${sy} Q${cx},${cy} ${tx},${ty}`;
    }

    // Node groups
    const nodeEl = nodeGroup
      .selectAll<SVGGElement, TagNodeDatum>("g.botanical-node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "botanical-node")
      .style("cursor", "pointer")
      .on("click", function (event, d) {
        event.stopPropagation();
        selectTag(d.tagNode);
      });

    // Glow
    nodeEl.append("path").attr("class", "glow")
      .attr("d", (d) => BOTANICAL_SHAPES[d.shapeIndex])
      .attr("fill", (d) => d.color)
      .attr("opacity", 0.12)
      .attr("transform", (d) => `scale(${d.baseScale * 1.4})`)
      .attr("filter", "url(#softGlow)");

    // Shape
    nodeEl.append("path").attr("class", "shape")
      .attr("d", (d) => BOTANICAL_SHAPES[d.shapeIndex])
      .attr("fill", (d) => d.color)
      .attr("opacity", (d) => (d.connectionCount === 0 ? 0.45 : 0.85))
      .attr("transform", (d) => `scale(${d.baseScale})`)
      .attr("stroke", "none");

    // Hover
    nodeEl
      .on("mouseover", function (_, d) {
        d3.select(this).select(".shape").transition().duration(200)
          .attr("opacity", 1).attr("transform", `scale(${d.baseScale * 1.08})`);
      })
      .on("mouseout", function (_, d) {
        d3.select(this).select(".shape").transition().duration(200)
          .attr("opacity", d.connectionCount === 0 ? 0.45 : 0.85)
          .attr("transform", `scale(${d.baseScale})`);
      });

    // Labels
    nodeEl.each(function (d) {
      const g = d3.select(this);
      g.append("text").attr("class", "tag-label")
        .attr("text-anchor", "middle")
        .attr("y", d.baseScale * 20 + 16)
        .attr("font-family", "'Cormorant Garamond', serif")
        .attr("font-style", "italic")
        .attr("font-size", "12px")
        .attr("fill", "#6B6B6B")
        .text(d.tagNode.tag);
      g.append("text")
        .attr("text-anchor", "middle")
        .attr("y", d.baseScale * 20 + 29)
        .attr("font-family", "'Inter', sans-serif")
        .attr("font-size", "12px")
        .attr("fill", "#737373")
        .text(`${d.tagNode.thoughts.length} thought${d.tagNode.thoughts.length !== 1 ? "s" : ""}`);
    });

    // Float animation styles
    const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
    styleEl.textContent = `
      @media (prefers-reduced-motion: no-preference) {
        ${nodes.map((_, i) => `
          @keyframes botanicalFloat${i} {
            0%, 100% { transform: translate(var(--tx), var(--ty)); }
            50% { transform: translate(var(--tx), calc(var(--ty) - ${4 + Math.random() * 5}px)); }
          }
        `).join("")}
      }
    `;
    svgRef.current?.appendChild(styleEl);

    const updatePositions = () => {
      nodeEl.attr("transform", (d) => `translate(${d.x ?? 0},${d.y ?? 0})`);
      linkEl.attr("d", getLinkPath);
    };

    function applyFloatAnimation() {
      nodeEl.each(function (d, i) {
        const el = this as SVGGElement;
        const dur = 3.5 + Math.random() * 2.5;
        const delay = i * 0.3 + Math.random() * 0.5;
        el.style.setProperty("--tx", `${d.x ?? 0}px`);
        el.style.setProperty("--ty", `${d.y ?? 0}px`);
        el.style.animation = `botanicalFloat${i} ${dur}s ease-in-out ${delay}s infinite`;
        el.style.transformOrigin = "center";
      });
    }

    if (layout === "force") {
      if (simulationRef.current) simulationRef.current.stop();
      simulationRef.current = d3
        .forceSimulation<TagNodeDatum>(nodes)
        .force("link", d3.forceLink<TagNodeDatum, TagLinkDatum>(filteredLinks).id((d) => d.id).strength(0.03))
        .force("charge", d3.forceManyBody().strength(-280))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("collision", d3.forceCollide().radius(55))
        .force("x", d3.forceX(width / 2).strength(0.04))
        .force("y", d3.forceY(height / 2).strength(0.04))
        .on("tick", updatePositions)
        .on("end", () => { setTimeout(applyFloatAnimation, 200); });

      nodeEl.call(
        d3.drag<SVGGElement, TagNodeDatum>()
          .on("start", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0.3).restart();
            d.fx = d.x; d.fy = d.y;
            (event.sourceEvent.currentTarget as SVGGElement).style.animation = "none";
          })
          .on("drag", (event, d) => { d.fx = event.x; d.fy = event.y; })
          .on("end", (event, d) => {
            if (!event.active) simulationRef.current?.alphaTarget(0);
            d.fx = null; d.fy = null;
          })
      );
    } else if (layout === "circular") {
      if (simulationRef.current) simulationRef.current.stop();
      const angleStep = (2 * Math.PI) / nodes.length;
      const r = Math.min(width, height) * 0.30;
      nodes.forEach((d, i) => {
        d.x = width / 2 + r * Math.cos(i * angleStep - Math.PI / 2);
        d.y = height / 2 + r * Math.sin(i * angleStep - Math.PI / 2);
      });
      // Set link paths immediately (resolved refs), then animate nodes
      linkEl.attr("d", getLinkPath);
      nodeEl.attr("transform", () => `translate(${width / 2},${height / 2})`)
        .transition().duration(800).ease(d3.easeCubicOut)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .on("end", function () { applyFloatAnimation(); });
      // Animate links alongside
      linkEl.transition().duration(800).ease(d3.easeCubicOut).attr("d", getLinkPath);
    } else {
      if (simulationRef.current) simulationRef.current.stop();
      const cols = Math.ceil(Math.sqrt(nodes.length));
      const spacingX = width / (cols + 1);
      const spacingY = height / (Math.ceil(nodes.length / cols) + 1);
      nodes.forEach((d, i) => {
        d.x = spacingX * ((i % cols) + 1);
        d.y = spacingY * (Math.floor(i / cols) + 1);
      });
      linkEl.attr("d", getLinkPath);
      nodeEl.attr("transform", () => `translate(${width / 2},${height / 2})`)
        .transition().duration(800).ease(d3.easeCubicOut)
        .attr("transform", (d) => `translate(${d.x},${d.y})`)
        .on("end", function () { applyFloatAnimation(); });
      linkEl.transition().duration(800).ease(d3.easeCubicOut).attr("d", getLinkPath);
    }

    svg.on("click", () => selectTag(null));
  }, [threshold, layout, selectTag]);

  useEffect(() => {
    buildGraph();
    const handleResize = () => buildGraph();
    window.addEventListener("resize", handleResize);
    return () => { window.removeEventListener("resize", handleResize); simulationRef.current?.stop(); };
  }, [buildGraph]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") selectTag(null); };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectTag]);

  const insights = selectedTag ? generateInsight(selectedTag, allTagNodes) : [];
  const synthesis = selectedTag ? generateSynthesis(selectedTag) : "";
  const selectedTagColor = selectedTag
    ? getNodeColor(allTagNodes.findIndex((n) => n.tag === selectedTag.tag))
    : PALETTE[0];

  return (
    <div ref={containerRef} className="fixed inset-0 w-full h-full pt-16">
      {/* Background */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(ellipse at 60% 30%, rgba(201,160,160,0.12) 0%, transparent 50%),
            radial-gradient(ellipse at 30% 70%, rgba(160,154,201,0.10) 0%, transparent 45%),
            radial-gradient(ellipse at 80% 80%, rgba(143,175,154,0.07) 0%, transparent 40%),
            #FAFAF6
          `,
        }}
      />

      <svg ref={svgRef} className="w-full h-full" />

      {/* Empty state */}
      {!thoughtsExist && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div
              className="mx-auto w-[120px] h-[120px] mb-6"
              style={{ background: "radial-gradient(circle, rgba(160,154,201,0.12) 0%, transparent 70%)", filter: "blur(25px)" }}
            />
            <p className="font-serif italic text-[1.1rem] text-[#707070]">
              Add thoughts to see your constellation.
            </p>
          </div>
        </div>
      )}

      {/* Controls — glassmorphic, bottom-left */}
      <div
        className="absolute bottom-8 left-8 flex items-end gap-5"
        style={{ zIndex: 10 }}
      >
        <div
          className="flex flex-col gap-4 rounded-[16px] p-5"
          style={{
            background: "rgba(255,255,255,0.6)",
            backdropFilter: "blur(16px) saturate(1.2)",
            border: "1px solid rgba(255,255,255,0.5)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.04)",
            minWidth: "220px",
          }}
        >
          <div>
            <label className="font-sans text-[0.75rem] text-[#6B6B6B] tracking-[0.08em] uppercase mb-2 block">
              Connection strength
            </label>
            <input
              type="range" min="0" max="3" step="1"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-[#C9A0A0]"
            />
          </div>
          <div>
            <label className="font-sans text-[0.75rem] text-[#6B6B6B] tracking-[0.08em] uppercase mb-2 block">
              Layout
            </label>
            <div className="flex gap-2">
              {(["force", "circular", "hierarchical"] as LayoutType[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLayout(l)}
                  className="font-sans text-[0.75rem] px-2.5 py-1.5 rounded-lg capitalize transition-all duration-200"
                  style={{
                    background: layout === l ? "rgba(201,160,160,0.18)" : "transparent",
                    color: layout === l ? "#C9A0A0" : "#6B6B6B",
                    border: `1px solid ${layout === l ? "rgba(201,160,160,0.25)" : "rgba(0,0,0,0.06)"}`,
                  }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend — inline with controls */}
        <p className="font-sans text-[0.75rem] text-[#737373] leading-[1.5] tracking-[0.02em] pb-1 max-w-[220px]">
          shape size = thought count &middot; line weight = co-occurrence &middot; click any theme to explore
        </p>
      </div>

      {/* Right panel overlay */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-20"
            onClick={() => selectTag(null)}
          />
        )}
      </AnimatePresence>

      {/* Right panel — offset below nav */}
      <div
        ref={panelRef}
        className="fixed right-0 z-30 overflow-y-auto"
        style={{
          top: "64px",
          height: "calc(100vh - 64px)",
          width: "380px",
          background: "#FAFAF6",
          borderLeft: "1px solid rgba(0,0,0,0.07)",
          transform: panelOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s ease-out",
          boxShadow: panelOpen ? "-8px 0 40px rgba(0,0,0,0.04)" : "none",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {selectedTag && (
          <div className="relative">
            {/* Close button */}
            <button
              onClick={() => selectTag(null)}
              className="absolute top-5 right-5 w-7 h-7 flex items-center justify-center rounded-full text-[16px] text-[#737373] hover:text-[#6B6B6B] hover:bg-[rgba(0,0,0,0.04)] transition-all leading-none"
              aria-label="Close panel"
            >
              &times;
            </button>

            {/* Tag name + count */}
            <div style={{ padding: "28px 32px 4px" }}>
              <p className="font-serif italic leading-[1.4]" style={{ fontSize: "1.5rem", color: "#1C1C1E" }}>
                {selectedTag.tag}
              </p>
              <p className="font-sans text-[0.72rem] text-[#737373] mt-1">
                {selectedTag.thoughts.length} thought{selectedTag.thoughts.length !== 1 ? "s" : ""} carry this theme
              </p>
            </div>

            {/* Mini radial graph */}
            {selectedTag.companionTags.length > 0 && (
              <div className="pt-2 pb-1">
                <MiniRadialGraph tagNode={selectedTag} allTagNodes={allTagNodes} onSelectTag={selectTag} />
              </div>
            )}

            {/* Companion tag pills (only if no graph shown, i.e. isolated tag) */}
            {selectedTag.companionTags.length === 0 && (
              <div className="px-8 pt-3 pb-4">
                <p className="font-serif italic text-[0.82rem] text-[#A0A0A0] leading-[1.55]">
                  This theme stands alone \u2014 not yet connected to any other ideas in your garden.
                </p>
              </div>
            )}

            {/* Divider */}
            <div className="mx-8" style={{ height: "1px", background: "rgba(0,0,0,0.06)" }} />

            {/* Timeline */}
            {selectedTag.thoughts.length >= 2 && (
              <div className="pt-4">
                <ThoughtTimeline thoughts={selectedTag.thoughts} tagColor={selectedTagColor} />
              </div>
            )}

            {/* Thoughts */}
            <div className="px-8 pt-3 pb-4">
              <h3 className="font-sans uppercase mb-3" style={{ fontSize: "12px", letterSpacing: "0.08em", color: "#6B6B6B" }}>
                Thoughts
              </h3>
              <div className="flex flex-col gap-2.5">
                {selectedTag.thoughts
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((thought) => (
                    <div key={thought.id} className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                      <p className="font-sans text-[0.82rem] text-[#4A4A4A] leading-[1.55] mb-1.5">
                        {thought.text.length > 100 ? thought.text.slice(0, 98) + "\u2026" : thought.text}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-sans text-[0.75rem] text-[#737373]">{formatDate(thought.createdAt)}</span>
                        {thought.tags.filter((t) => t !== selectedTag.tag).map((t) => (
                          <button
                            key={t}
                            onClick={() => { const node = allTagNodes.find((n) => n.tag === t); if (node) selectTag(node); }}
                            className="font-sans text-[0.75rem] px-1.5 py-0.5 rounded-full hover:bg-[rgba(201,160,160,0.15)] transition-colors"
                            style={{ background: "rgba(201,160,160,0.08)", color: "#737373" }}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-8" style={{ height: "1px", background: "rgba(0,0,0,0.05)" }} />

            {/* Patterns */}
            <div className="px-8 pt-5 pb-4">
              <h3 className="font-sans uppercase mb-3" style={{ fontSize: "12px", letterSpacing: "0.08em", color: "#6B6B6B" }}>
                Patterns
              </h3>
              <div className="flex flex-col gap-2.5">
                {insights.slice(0, 3).map((insight, i) => (
                  <div key={i} className="flex gap-2.5 items-start">
                    <div className="mt-[6px] flex-shrink-0" style={{ width: "5px", height: "5px", borderRadius: "50%", background: selectedTagColor, opacity: 0.5 }} />
                    <p className="font-serif italic text-[0.8rem] leading-[1.55]" style={{ color: "#7A7A7A" }}>
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="mx-8" style={{ height: "1px", background: "rgba(0,0,0,0.05)" }} />

            {/* Synthesis */}
            <div className="px-8 pt-5 pb-10">
              <div className="rounded-xl p-4" style={{ background: `linear-gradient(135deg, ${selectedTagColor}08, ${selectedTagColor}14)` }}>
                <p className="font-serif italic" style={{ fontSize: "0.85rem", color: "#6A6A6A", lineHeight: 1.65 }}>
                  {synthesis}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
