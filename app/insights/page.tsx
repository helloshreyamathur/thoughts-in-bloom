"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { getThoughts, getSeasons, formatDate, type Thought, type Season } from "@/lib/storage";
import { getTagColor, SOURCE_TYPES } from "@/lib/tags";
import { SourceIcon } from "@/components/icons/SourceIcons";
import EvolutionTimeline from "@/components/insights/EvolutionTimeline";
import {
  getWeeklyBuckets,
  getGrowthDepthSignal,
  getThoughtArcs,
  getSourcePatterns,
  getSmartPrompts,
} from "@/lib/insights";

// --- Helpers kept from original ---

function getDailyThought(thoughts: Thought[]): Thought | null {
  if (!thoughts.length) return null;
  const dateStr = new Date().toISOString().split("T")[0];
  const seed = dateStr.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return thoughts[seed % thoughts.length];
}

function getTagFrequency(thoughts: Thought[]): [string, number][] {
  const freq: Record<string, number> = {};
  thoughts.forEach((t) => t.tags.forEach((tag) => (freq[tag] = (freq[tag] ?? 0) + 1)));
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

// --- Styles ---

const glassStyle = {
  background: "rgba(255,255,255,0.65)",
  backdropFilter: "blur(16px) saturate(1.2)",
  border: "1px solid rgba(255,255,255,0.5)",
  boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function InsightsPage() {
  const [allThoughts, setAllThoughts] = useState<Thought[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);

  useEffect(() => {
    setAllThoughts(getThoughts().filter((t) => !t.archived));
    setSeasons(getSeasons());
  }, []);

  // Filter thoughts by season + source
  const thoughts = useMemo(() => {
    let result = allThoughts;
    if (activeSeasonId) {
      result = result.filter((t) => t.seasonId === activeSeasonId);
    }
    if (activeSource) {
      result = result.filter((t) => t.source === activeSource);
    }
    return result;
  }, [allThoughts, activeSeasonId, activeSource]);

  const hasFilters = activeSeasonId !== null || activeSource !== null;

  // Computations — all derived from filtered thoughts
  const allTagFreq = getTagFrequency(thoughts);
  const maxTagCount = allTagFreq[0]?.[1] ?? 1;
  const dailyThought = getDailyThought(thoughts);

  const weeklyBuckets = useMemo(() => getWeeklyBuckets(thoughts, 8), [thoughts]);
  const growthDepth = useMemo(() => getGrowthDepthSignal(thoughts), [thoughts]);
  const arcs = useMemo(() => getThoughtArcs(thoughts), [thoughts]);
  const sourceInsight = useMemo(() => getSourcePatterns(thoughts), [thoughts]);
  const smartPrompts = useMemo(() => getSmartPrompts(thoughts), [thoughts]);

  // Sources that actually exist in data (for filter pills)
  const availableSources = useMemo(() => {
    const sources = new Set<string>();
    allThoughts.forEach((t) => { if (t.source) sources.add(t.source); });
    return Array.from(sources);
  }, [allThoughts]);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pt-28 pb-24 px-6"
    >
      <div className="max-w-[900px] mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif italic text-[3rem] text-[#1C1C1E] leading-[1.15] tracking-[-0.02em] mb-3">
            Insights
          </h1>
          <p className="font-sans text-[0.8rem] text-[#6B6B6B] font-light">
            Patterns emerging from your garden
          </p>
        </div>

        {/* Filters: Season + Source */}
        {(seasons.length > 0 || availableSources.length > 0) && (
          <div className="mb-8 space-y-3">
            {/* Season pills */}
            {seasons.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans text-[0.75rem] text-[#737373] tracking-[0.06em] uppercase mr-1">
                  Season
                </span>
                <button
                  onClick={() => setActiveSeasonId(null)}
                  className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all duration-200"
                  style={{
                    background: activeSeasonId === null ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                    border: activeSeasonId === null ? "1px solid rgba(201,160,160,0.3)" : "1px solid rgba(0,0,0,0.04)",
                    color: activeSeasonId === null ? "#1C1C1E" : "#6B6B6B",
                    boxShadow: activeSeasonId === null ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  All
                </button>
                {seasons.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSeasonId(activeSeasonId === s.id ? null : s.id)}
                    className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all duration-200"
                    style={{
                      background: activeSeasonId === s.id ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                      border: activeSeasonId === s.id ? "1px solid rgba(201,160,160,0.3)" : "1px solid rgba(0,0,0,0.04)",
                      color: activeSeasonId === s.id ? "#1C1C1E" : "#6B6B6B",
                      boxShadow: activeSeasonId === s.id ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                    }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Source pills */}
            {availableSources.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-sans text-[0.75rem] text-[#737373] tracking-[0.06em] uppercase mr-1">
                  Source
                </span>
                <button
                  onClick={() => setActiveSource(null)}
                  className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all duration-200"
                  style={{
                    background: activeSource === null ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                    border: activeSource === null ? "1px solid rgba(201,160,160,0.3)" : "1px solid rgba(0,0,0,0.04)",
                    color: activeSource === null ? "#1C1C1E" : "#6B6B6B",
                    boxShadow: activeSource === null ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                  }}
                >
                  All
                </button>
                {availableSources.map((src) => {
                  const color = getTagColor(src);
                  return (
                    <button
                      key={src}
                      onClick={() => setActiveSource(activeSource === src ? null : src)}
                      className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all duration-200 flex items-center gap-1.5 capitalize"
                      style={{
                        background: activeSource === src ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
                        border: activeSource === src ? `1px solid ${color.text}40` : "1px solid rgba(0,0,0,0.04)",
                        color: activeSource === src ? color.text : "#6B6B6B",
                        boxShadow: activeSource === src ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
                      }}
                    >
                      <SourceIcon source={src} size={10} color={activeSource === src ? color.text : "#6B6B6B"} />
                      {src}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Active filter indicator */}
            {hasFilters && (
              <div className="flex items-center gap-2">
                <p className="font-sans text-[0.75rem] text-[#6B6B6B] italic">
                  Showing insights for {activeSeasonId ? seasons.find(s => s.id === activeSeasonId)?.name : "all seasons"}
                  {activeSource ? `, ${activeSource} sources` : ""}
                  {" "}({thoughts.length} thought{thoughts.length !== 1 ? "s" : ""})
                </p>
                <button
                  onClick={() => { setActiveSeasonId(null); setActiveSource(null); }}
                  className="font-sans text-[0.75rem] text-[#C9A0A0] hover:text-[#B08080] transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col gap-5">
          {/* Row 1: Evolution Timeline — full width */}
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              How your thinking evolves
            </h2>
            <p className="font-sans text-[0.75rem] text-[#6B6B6B] mb-5">
              Your dominant themes over the past 8 weeks
            </p>
            <EvolutionTimeline weeks={weeklyBuckets} />
          </motion.div>

          {/* Row 2: Growth vs Depth | Source Patterns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Growth vs Depth */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl p-7 overflow-hidden relative"
              style={glassStyle}
            >
              <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-5">
                Exploring or deepening?
              </h2>

              {/* Spectrum bar */}
              <div className="mb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-sans text-[0.75rem] text-[#8FAF9A] tracking-[0.04em] uppercase">
                    Deepening
                  </span>
                  <span className="font-sans text-[0.75rem] text-[#A09AC9] tracking-[0.04em] uppercase">
                    Exploring
                  </span>
                </div>
                <div
                  className="relative h-2 rounded-full overflow-hidden"
                  style={{
                    background: "linear-gradient(to right, rgba(143,175,154,0.3), rgba(160,154,201,0.3))",
                  }}
                >
                  {/* Inner filled gradient */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: "linear-gradient(to right, #8FAF9A, #A09AC9)",
                      opacity: 0.5,
                    }}
                  />
                  {/* Position marker */}
                  <motion.div
                    initial={{ left: "50%" }}
                    animate={{ left: `${Math.max(8, Math.min(92, growthDepth.ratio * 100))}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white"
                    style={{
                      background: growthDepth.ratio > 0.5 ? "#A09AC9" : "#8FAF9A",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                    }}
                  />
                </div>
              </div>

              {/* Sentence */}
              <p className="font-serif italic text-[0.9rem] text-[#4A4A4A] leading-[1.6] mb-4">
                {growthDepth.sentence}
              </p>

              {/* New tags pills */}
              {growthDepth.newTags.length > 0 && (
                <div>
                  <span className="font-sans text-[0.75rem] text-[#737373] tracking-[0.06em] uppercase block mb-1.5">
                    New this week
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {growthDepth.newTags.map((tag) => {
                      const color = getTagColor(tag);
                      return (
                        <span
                          key={tag}
                          className="font-sans text-[0.75rem] px-2 py-0.5 rounded-full"
                          style={{ background: color.bg, color: color.text }}
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Source Patterns */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl p-7 overflow-hidden relative"
              style={glassStyle}
            >
              <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-5">
                Where ideas come from
              </h2>

              {sourceInsight.patterns.length === 0 ? (
                <p className="font-sans text-[0.78rem] text-[#737373] italic">
                  Add source tags to your thoughts to see patterns.
                </p>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mb-5">
                    {sourceInsight.patterns.map((sp) => {
                      const maxCount = sourceInsight.patterns[0]?.count || 1;
                      const color = getTagColor(sp.source);
                      return (
                        <div key={sp.source}>
                          <div className="flex items-center gap-2 mb-1">
                            <SourceIcon source={sp.source} size={13} color={color.text} />
                            <span className="font-sans text-[0.75rem] text-[#6B6B6B] capitalize tracking-[0.02em]">
                              {sp.source}
                            </span>
                            <span className="font-sans text-[0.75rem] text-[#737373] ml-auto">
                              {sp.count}
                            </span>
                          </div>
                          <div
                            className="h-1 rounded-full"
                            style={{ background: "rgba(0,0,0,0.04)" }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{
                                width: `${(sp.count / maxCount) * 100}%`,
                                background: color.text,
                                opacity: 0.5,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Insight sentence */}
                  <p className="font-serif italic text-[0.85rem] text-[#6B6B6B] leading-[1.6]">
                    {sourceInsight.sentence}
                  </p>
                </>
              )}
            </motion.div>
          </div>

          {/* Row 3: Thought Arcs — full width */}
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              Thought arcs
            </h2>
            <p className="font-sans text-[0.75rem] text-[#6B6B6B] mb-5">
              How your ideas evolve over time
            </p>

            {arcs.length === 0 ? (
              <p className="font-sans text-[0.78rem] text-[#737373] italic">
                Arcs emerge when themes recur — keep exploring.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {arcs.map((arc) => {
                  const color = getTagColor(arc.tag);
                  const totalSpan =
                    new Date(arc.thoughts[arc.thoughts.length - 1].createdAt).getTime() -
                    new Date(arc.thoughts[0].createdAt).getTime();

                  return (
                    <div key={arc.tag}>
                      {/* Arc header */}
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: color.text, opacity: 0.6 }}
                        />
                        <span
                          className="font-sans text-[0.75rem] tracking-[0.02em]"
                          style={{ color: color.text }}
                        >
                          {arc.tag}
                        </span>
                        <span className="font-sans text-[0.75rem] text-[#737373] ml-auto">
                          {arc.thoughts.length} thought{arc.thoughts.length !== 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Timeline */}
                      <div className="relative h-6 mb-2">
                        {/* Base line */}
                        <div
                          className="absolute top-1/2 left-3 right-3 h-px -translate-y-1/2"
                          style={{ background: `${color.text}25` }}
                        />
                        {/* Dots */}
                        {arc.thoughts.map((t, tIdx) => {
                          const pos =
                            totalSpan > 0
                              ? (new Date(t.createdAt).getTime() -
                                  new Date(arc.thoughts[0].createdAt).getTime()) /
                                totalSpan
                              : tIdx / Math.max(arc.thoughts.length - 1, 1);
                          const isEndpoint = tIdx === 0 || tIdx === arc.thoughts.length - 1;
                          return (
                            <div
                              key={t.id}
                              className="absolute top-1/2 rounded-full"
                              style={{
                                left: `calc(12px + ${pos} * (100% - 24px))`,
                                width: isEndpoint ? "8px" : "5px",
                                height: isEndpoint ? "8px" : "5px",
                                background: color.text,
                                opacity: isEndpoint ? 0.7 : 0.3,
                                transform: "translate(-50%, -50%)",
                              }}
                              title={`${formatDate(t.createdAt)}: ${t.text.slice(0, 60)}...`}
                            />
                          );
                        })}
                      </div>

                      {/* Narrative */}
                      <p className="font-sans text-[0.75rem] text-[#6B6B6B] leading-[1.6] pl-1">
                        {arc.sentence}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>

          {/* Row 4: Most Frequent Tags | Smart Reflection Prompts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Most Frequent Tags */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl p-7 overflow-hidden relative"
              style={glassStyle}
            >
              <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-5">
                Most frequent tags
              </h2>
              {allTagFreq.length === 0 ? (
                <p className="font-sans text-[0.78rem] text-[#737373]">No tags yet</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {allTagFreq.slice(0, 6).map(([tag, count]) => {
                    const color = getTagColor(tag);
                    return (
                      <div key={tag}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-sans text-[0.75rem] text-[#6B6B6B] tracking-[0.02em]">
                            {tag}
                          </span>
                          <span className="font-sans text-[0.75rem] text-[#737373]">{count}</span>
                        </div>
                        <div
                          className="h-1 rounded-full"
                          style={{ background: "rgba(0,0,0,0.05)" }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(count / maxTagCount) * 100}%`,
                              background: color.text,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* Smart Reflection Prompts */}
            <motion.div
              custom={5}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl p-7 overflow-hidden relative"
              style={glassStyle}
            >
              <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
                Reflections for you
              </h2>
              <p className="font-sans text-[0.75rem] text-[#6B6B6B] mb-5">
                Based on patterns in your garden
              </p>
              <div className="flex flex-col gap-4">
                {smartPrompts.map((sp, i) => (
                  <div key={i}>
                    <span className="font-sans text-[0.75rem] text-[#C9A0A0] tracking-[0.1em] uppercase block mb-1.5">
                      {sp.label}
                    </span>
                    <div
                      className="pl-3"
                      style={{ borderLeft: "2px solid rgba(201,160,160,0.3)" }}
                    >
                      <p className="font-serif italic text-[0.88rem] text-[#6B6B6B] leading-[1.65]">
                        {sp.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Row 5: Thought of the Day — full width */}
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={{
              background:
                "linear-gradient(135deg, rgba(201,160,160,0.08) 0%, rgba(160,154,201,0.05) 100%)",
              backdropFilter: "blur(16px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <span className="absolute top-4 left-6 font-serif text-[6rem] leading-none text-[rgba(201,160,160,0.1)] pointer-events-none select-none">
              &ldquo;
            </span>
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-5">
              Thought of the day
            </h2>
            {!dailyThought ? (
              <p className="font-sans text-[0.78rem] text-[#737373]">
                Add your first thought to see it here.
              </p>
            ) : (
              <div>
                <p className="font-sans text-[1.4rem] text-[#1C1C1E] leading-[1.6] tracking-[-0.01em] mb-4 max-w-[600px]">
                  &ldquo;{dailyThought.text}&rdquo;
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {dailyThought.tags.map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        className="font-sans text-[0.75rem] px-2 py-0.5 rounded-full"
                        style={{
                          background: color.bg,
                          color: color.text,
                          border: `1px solid ${color.text}44`,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.main>
  );
}
