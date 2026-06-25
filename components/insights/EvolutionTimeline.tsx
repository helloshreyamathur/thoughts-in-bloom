"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { WeekBucket } from "@/lib/insights";

interface EvolutionTimelineProps {
  weeks: WeekBucket[];
}

const STREAM_COLORS = ["#C9A0A0", "#8FAF9A", "#A09AC9", "#C9B89A", "#9AC9C0"];

export default function EvolutionTimeline({ weeks }: EvolutionTimelineProps) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  // Find top 5 tags across all weeks
  const { topTags, streamData, maxTotal } = useMemo(() => {
    const allTagFreq: Record<string, number> = {};
    weeks.forEach((w) => {
      Object.entries(w.tags).forEach(([tag, count]) => {
        allTagFreq[tag] = (allTagFreq[tag] || 0) + count;
      });
    });

    const topTags = Object.entries(allTagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    // Build stream data: for each week, stack of tag values
    let maxTotal = 0;
    const streamData = weeks.map((w) => {
      const values: number[] = topTags.map((tag) => w.tags[tag] || 0);
      const total = values.reduce((s, v) => s + v, 0);
      if (total > maxTotal) maxTotal = total;
      return { values, total, week: w };
    });

    return { topTags, streamData, maxTotal };
  }, [weeks]);

  if (topTags.length === 0) {
    return (
      <div className="flex items-center justify-center h-[180px]">
        <p className="font-sans text-[0.78rem] text-[#BDBDBD] italic">
          Keep blooming — your evolution will appear after a few thoughts.
        </p>
      </div>
    );
  }

  // SVG dimensions
  const width = 700;
  const height = 180;
  const padding = { top: 20, right: 20, bottom: 32, left: 20 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const colWidth = chartW / Math.max(streamData.length - 1, 1);
  const scale = maxTotal > 0 ? chartH / (maxTotal * 1.2) : 1;

  // Build stacked area paths using smooth curves
  // For each tag layer, compute top and bottom y coordinates per week
  const buildPath = (tagIndex: number): string => {
    const points: { x: number; yTop: number; yBot: number }[] = streamData.map(
      (d, i) => {
        const x = padding.left + i * colWidth;
        // Stack: sum of layers below this one
        let stackBelow = 0;
        for (let t = 0; t < tagIndex; t++) {
          stackBelow += d.values[t];
        }
        const yBot = padding.top + chartH - stackBelow * scale;
        const yTop = yBot - d.values[tagIndex] * scale;
        return { x, yTop, yBot };
      }
    );

    if (points.length < 2) return "";

    // Build smooth path: top edge left→right, bottom edge right→left
    const topPath = smoothLine(points.map((p) => [p.x, p.yTop]));
    const botPath = smoothLine(points.map((p) => [p.x, p.yBot]).reverse());

    return `${topPath} L ${points[points.length - 1].x},${points[points.length - 1].yBot} ${botPath.replace("M", "L")} Z`;
  };

  // Smooth bezier interpolation for a series of [x, y] points
  function smoothLine(pts: number[][]): string {
    if (pts.length < 2) return "";
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const prev = pts[i - 1];
      const curr = pts[i];
      const cpx = (prev[0] + curr[0]) / 2;
      d += ` C ${cpx},${prev[1]} ${cpx},${curr[1]} ${curr[0]},${curr[1]}`;
    }
    return d;
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        style={{ maxHeight: "200px" }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Stream layers */}
        {topTags.map((tag, tagIdx) => {
          const path = buildPath(tagIdx);
          if (!path) return null;
          return (
            <path
              key={tag}
              d={path}
              fill={STREAM_COLORS[tagIdx % STREAM_COLORS.length]}
              opacity={0.35}
              className="transition-opacity duration-200"
              style={{
                opacity: hoveredWeek !== null ? 0.2 : 0.35,
              }}
            />
          );
        })}

        {/* Hover columns */}
        {streamData.map((d, i) => {
          const x = padding.left + i * colWidth;
          return (
            <g key={i}>
              <rect
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartH}
                fill="transparent"
                onMouseEnter={() => setHoveredWeek(i)}
                onMouseLeave={() => setHoveredWeek(null)}
                className="cursor-default"
              />
              {/* Vertical guide on hover */}
              {hoveredWeek === i && (
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={padding.top + chartH}
                  stroke="rgba(0,0,0,0.08)"
                  strokeWidth="1"
                  strokeDasharray="3,3"
                />
              )}
            </g>
          );
        })}

        {/* Week labels */}
        {streamData.map((d, i) => (
          <text
            key={i}
            x={padding.left + i * colWidth}
            y={height - 6}
            textAnchor="middle"
            className="font-sans"
            style={{
              fontSize: "9px",
              fill: hoveredWeek === i ? "#6B6B6B" : "#C0C0C0",
              transition: "fill 0.15s",
            }}
          >
            {d.week.weekLabel}
          </text>
        ))}
      </svg>

      {/* Hover tooltip */}
      {hoveredWeek !== null && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.12 }}
          className="absolute top-2 right-3 rounded-xl px-3.5 py-2.5"
          style={{
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          }}
        >
          <p className="font-sans text-[0.62rem] text-[#8A8A8A] mb-1.5">
            Week of {streamData[hoveredWeek].week.weekLabel}
          </p>
          {topTags.map((tag, idx) => {
            const val = streamData[hoveredWeek].values[idx];
            if (val === 0) return null;
            return (
              <div key={tag} className="flex items-center gap-2 mb-0.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ background: STREAM_COLORS[idx] }}
                />
                <span className="font-sans text-[0.62rem] text-[#6B6B6B]">
                  {tag}
                </span>
                <span className="font-sans text-[0.58rem] text-[#B0B0B0] ml-auto">
                  {val}
                </span>
              </div>
            );
          })}
          {streamData[hoveredWeek].total === 0 && (
            <p className="font-sans text-[0.6rem] text-[#C0C0C0] italic">
              No thoughts this week
            </p>
          )}
        </motion.div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 mt-2 px-1">
        {topTags.map((tag, idx) => (
          <div key={tag} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: STREAM_COLORS[idx], opacity: 0.6 }}
            />
            <span className="font-sans text-[0.6rem] text-[#9A9A9A] tracking-[0.02em]">
              {tag}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
