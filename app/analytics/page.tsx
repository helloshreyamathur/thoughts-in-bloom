"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, type Variants } from "framer-motion";
import { getThoughts, getUserName, type Thought } from "@/lib/storage";
import { getTagColor } from "@/lib/tags";
import { SourceIcon } from "@/components/icons/SourceIcons";

// --- Existing helpers ---

function getStreak(thoughts: Thought[]): number {
  if (!thoughts.length) return 0;
  const days = new Set(
    thoughts.map((t) => {
      const d = new Date(t.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    })
  );
  let streak = 0;
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const startOffset = days.has(todayKey) ? 0 : 1;
  for (let i = startOffset; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (days.has(key)) streak++;
    else break;
  }
  return streak;
}

function getMostActiveDay(thoughts: Thought[]): string {
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const freq = [0, 0, 0, 0, 0, 0, 0];
  thoughts.forEach((t) => freq[new Date(t.createdAt).getDay()]++);
  const max = Math.max(...freq);
  if (max === 0) return "\u2014";
  return DAYS[freq.indexOf(max)];
}

function getMostActiveDayCount(thoughts: Thought[]): number {
  const freq = [0, 0, 0, 0, 0, 0, 0];
  thoughts.forEach((t) => freq[new Date(t.createdAt).getDay()]++);
  return Math.max(...freq);
}

function get30DayData(thoughts: Thought[]): { date: Date; count: number }[] {
  const data: { date: Date; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = thoughts.filter((t) => {
      const created = new Date(t.createdAt);
      return created >= d && created < next;
    }).length;
    data.push({ date: d, count });
  }
  return data;
}

function getHeatColor(count: number, max: number): string {
  if (count === 0) return "rgba(0,0,0,0.04)";
  const intensity = count / Math.max(max, 1);
  if (intensity < 0.33) return "rgba(201,160,160,0.4)";
  if (intensity < 0.66) return "rgba(201,160,160,0.65)";
  return "rgba(201,160,160,0.9)";
}

// --- New helpers ---

function getTimeOfDayDistribution(thoughts: Thought[]): number[] {
  // 24 buckets, one per hour
  const hours = new Array(24).fill(0);
  thoughts.forEach((t) => {
    const h = new Date(t.createdAt).getHours();
    hours[h]++;
  });
  return hours;
}

function getDayOfWeekDistribution(thoughts: Thought[]): number[] {
  // 7 buckets: Mon-Sun
  const days = new Array(7).fill(0);
  thoughts.forEach((t) => {
    const d = (new Date(t.createdAt).getDay() + 6) % 7; // 0=Mon
    days[d]++;
  });
  return days;
}

function getWeeklyNewTags(thoughts: Thought[]): { week: string; newCount: number; totalCount: number }[] {
  // Group thoughts by week, track cumulative tags
  const sorted = [...thoughts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (sorted.length === 0) return [];

  const seenTags = new Set<string>();
  const weeks: { week: string; newCount: number; totalCount: number }[] = [];
  let currentWeekStart = getMonday(new Date(sorted[0].createdAt));
  let weekNewTags = 0;

  sorted.forEach((t) => {
    const tMonday = getMonday(new Date(t.createdAt));
    if (tMonday.getTime() !== currentWeekStart.getTime()) {
      weeks.push({
        week: formatWeekLabel(currentWeekStart),
        newCount: weekNewTags,
        totalCount: seenTags.size,
      });
      currentWeekStart = tMonday;
      weekNewTags = 0;
    }
    t.tags.forEach((tag) => {
      if (!seenTags.has(tag)) {
        seenTags.add(tag);
        weekNewTags++;
      }
    });
  });
  // Push last week
  weeks.push({
    week: formatWeekLabel(currentWeekStart),
    newCount: weekNewTags,
    totalCount: seenTags.size,
  });

  return weeks.slice(-8); // Last 8 weeks
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatWeekLabel(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function getSourceDistribution(thoughts: Thought[]): { source: string; count: number }[] {
  const freq: Record<string, number> = {};
  thoughts.forEach((t) => {
    const src = t.source || "untagged";
    freq[src] = (freq[src] || 0) + 1;
  });
  return Object.entries(freq)
    .filter(([s]) => s !== "untagged")
    .sort((a, b) => b[1] - a[1])
    .map(([source, count]) => ({ source, count }));
}

function getMilestones(thoughts: Thought[]): string[] {
  const milestones: string[] = [];
  const count = thoughts.length;

  // Thought milestones
  if (count >= 100) milestones.push("Century gardener \u2014 100+ thoughts bloomed");
  else if (count >= 50) milestones.push("50 thoughts bloomed \u2014 your garden is flourishing");
  else if (count >= 25) milestones.push("25 thoughts \u2014 a garden taking shape");
  else if (count >= 10) milestones.push("10 thoughts \u2014 roots are forming");

  // Tag diversity
  const tags = new Set(thoughts.flatMap((t) => t.tags));
  if (tags.size >= 30) milestones.push("30+ unique tags \u2014 a rich inner landscape");
  else if (tags.size >= 15) milestones.push(`${tags.size} unique tags \u2014 your vocabulary is growing`);

  // Streak
  const streak = getStreak(thoughts);
  if (streak >= 14) milestones.push(`${streak}-day streak \u2014 consistency is its own reward`);
  else if (streak >= 7) milestones.push(`${streak}-day streak \u2014 a full week of reflection`);

  // Days since first thought
  if (count > 0) {
    const sorted = [...thoughts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const firstDate = new Date(sorted[0].createdAt);
    const daysSince = Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSince >= 90) milestones.push(`Gardening for ${daysSince} days \u2014 a season of thought`);
    else if (daysSince >= 30) milestones.push(`${daysSince} days since your first bloom`);
  }

  // Most connected thought
  let maxConnections = 0;
  thoughts.forEach((t) => {
    let connections = 0;
    thoughts.forEach((other) => {
      if (other.id === t.id) return;
      if (t.tags.some((tag) => other.tags.includes(tag))) connections++;
    });
    if (connections > maxConnections) maxConnections = connections;
  });
  if (maxConnections >= 5) milestones.push(`Your most connected thought links to ${maxConnections} others`);

  return milestones.slice(0, 3);
}

function getGardenHealthSummary(thoughts: Thought[], userName: string | null): string {
  if (thoughts.length === 0) return "Your garden is empty \u2014 plant your first thought to begin.";

  const tags = new Set(thoughts.flatMap((t) => t.tags));
  const sorted = [...thoughts].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const firstDate = new Date(sorted[0].createdAt);
  const daysSince = Math.floor((Date.now() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
  const streak = getStreak(thoughts);
  const mostActive = getMostActiveDay(thoughts);
  const name = userName || "Your garden";

  const parts: string[] = [];
  parts.push(`${name}'s garden holds ${thoughts.length} thought${thoughts.length !== 1 ? "s" : ""} across ${tags.size} tag${tags.size !== 1 ? "s" : ""}`);

  if (daysSince > 0) {
    parts[0] += `, planted over ${daysSince} day${daysSince !== 1 ? "s" : ""}`;
  }
  parts[0] += ".";

  if (mostActive !== "\u2014") {
    parts.push(`${mostActive}s tend to be the most reflective day.`);
  }

  if (streak > 1) {
    parts.push(`You're on a ${streak}-day streak \u2014 keep the momentum.`);
  } else if (streak === 1) {
    parts.push("You bloomed today \u2014 the streak begins.");
  }

  // Source diversity
  const sources = getSourceDistribution(thoughts);
  if (sources.length >= 2) {
    parts.push(`You draw most from ${sources[0].source}s, but ${sources.length} different sources feed your thinking.`);
  }

  return parts.join(" ");
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
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

export default function AnalyticsPage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setThoughts(getThoughts());
    setUserName(getUserName());
  }, []);

  const active = thoughts.filter((t) => !t.archived);
  const allTags = new Set(thoughts.flatMap((t) => t.tags));
  const streak = getStreak(active);
  const mostActiveDay = getMostActiveDay(active);
  const mostActiveDayCount = getMostActiveDayCount(active);
  const heatmapData = get30DayData(active);
  const maxCount = Math.max(...heatmapData.map((d) => d.count));

  const timeDistribution = useMemo(() => getTimeOfDayDistribution(active), [active]);
  const dayDistribution = useMemo(() => getDayOfWeekDistribution(active), [active]);
  const weeklyTags = useMemo(() => getWeeklyNewTags(active), [active]);
  const sourceDistribution = useMemo(() => getSourceDistribution(active), [active]);
  const milestones = useMemo(() => getMilestones(active), [active]);
  const healthSummary = useMemo(() => getGardenHealthSummary(active, userName), [active, userName]);

  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const metricCards: { value: string; label: string; accent: string; sublabel?: string }[] = [
    { value: active.length.toString(), label: "Thoughts bloomed", accent: "#C9A0A0" },
    { value: allTags.size.toString(), label: "Tags created", accent: "#8FAF9A" },
    { value: mostActiveDay, label: "Most active day", accent: "#A09AC9", sublabel: mostActiveDayCount > 0 ? `${mostActiveDayCount} thoughts` : undefined },
    { value: streak.toString(), label: "Day streak", accent: "#C9B89A" },
  ];

  // Time-of-day peak
  const maxHour = timeDistribution.indexOf(Math.max(...timeDistribution));
  const timeLabel = maxHour < 6 ? "late night" : maxHour < 12 ? "morning" : maxHour < 17 ? "afternoon" : maxHour < 21 ? "evening" : "late night";
  const maxTimeCount = Math.max(...timeDistribution, 1);

  // Day-of-week max
  const maxDayCount = Math.max(...dayDistribution, 1);

  // Weekly tags max
  const maxWeeklyNew = Math.max(...weeklyTags.map((w) => w.newCount), 1);

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pt-28 pb-24 px-6"
    >
      <div className="max-w-[900px] mx-auto">
        <div className="mb-12">
          <h1 className="font-serif italic text-[3rem] text-[#1C1C1E] leading-[1.15] tracking-[-0.02em] mb-3">
            Analytics
          </h1>
          <p className="font-sans text-[0.8rem] text-[#6B6B6B] font-light">
            Your garden at a glance
          </p>
        </div>

        {/* Garden Health Summary */}
        {active.length > 0 && (
          <motion.div
            custom={0}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 mb-6 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, rgba(201,160,160,0.06) 0%, rgba(143,175,154,0.04) 100%)",
              backdropFilter: "blur(16px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <p className="font-serif italic text-[1.05rem] text-[#4A4A4A] leading-[1.7]">
              {healthSummary}
            </p>
          </motion.div>
        )}

        {/* Metric cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {metricCards.map((card, i) => (
            <motion.div
              key={i}
              custom={i + 1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="rounded-2xl p-6 overflow-hidden relative"
              style={glassStyle}
            >
              <p
                className="font-serif italic text-[2.5rem] leading-none tracking-[-0.02em] mb-2"
                style={{ color: card.accent }}
              >
                {card.value}
              </p>
              <p className="font-sans text-[0.72rem] text-[#6B6B6B] tracking-[0.03em]">
                {card.label}
              </p>
              {card.sublabel && <p className="font-sans text-[0.62rem] text-[#BDBDBD] mt-0.5">{card.sublabel}</p>}
            </motion.div>
          ))}
        </div>

        {/* Heatmap */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
          className="rounded-2xl p-7 overflow-hidden relative mb-6"
          style={glassStyle}
        >
          <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-6">
            30-day activity
          </h2>
          {(() => {
            const firstDayOfWeek = (heatmapData[0]?.date.getDay() + 6) % 7;
            const paddedData: ({ date: Date; count: number } | null)[] = [
              ...Array.from({ length: firstDayOfWeek }, () => null),
              ...heatmapData,
            ];
            return (
              <>
                <div className="grid gap-1.5" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                  {DAY_LABELS.map((d) => (
                    <div key={d} className="text-center font-sans text-[0.58rem] text-[#BDBDBD] mb-1">{d}</div>
                  ))}
                  {paddedData.map((item, i) => (
                    <div key={i} className="group relative">
                      <div
                        className="w-full rounded-[4px] transition-transform hover:scale-110"
                        style={{
                          aspectRatio: "1",
                          background: item ? getHeatColor(item.count, maxCount) : "transparent",
                          minHeight: "28px",
                        }}
                      />
                      {item && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-all duration-150 pointer-events-none z-10 rounded-lg px-2 py-1" style={{ background: "#1C1C1E", whiteSpace: "nowrap" }}>
                          <span className="font-sans text-[0.58rem] text-white">
                            {item.date.getDate()} {MONTHS[item.date.getMonth()]} — {item.count} thought{item.count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-5">
                  <span className="font-sans text-[0.62rem] text-[#BDBDBD]">
                    {heatmapData[0]?.date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-sans text-[0.6rem] text-[#BDBDBD]">Less</span>
                    <div className="w-20 h-2.5 rounded-full" style={{ background: "linear-gradient(90deg, rgba(201,160,160,0.1) 0%, rgba(201,160,160,0.9) 100%)" }} />
                    <span className="font-sans text-[0.6rem] text-[#BDBDBD]">More</span>
                  </div>
                  <span className="font-sans text-[0.62rem] text-[#BDBDBD]">Today</span>
                </div>
              </>
            );
          })()}
        </motion.div>

        {/* Row: Time of Day + Day of Week */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Time of Day */}
          <motion.div
            custom={6}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              When you think
            </h2>
            <p className="font-sans text-[0.7rem] text-[#ABABAB] mb-5">
              {active.length > 0 ? `You're a ${timeLabel} thinker` : "Bloom some thoughts to see your rhythm"}
            </p>

            {/* Radial clock chart */}
            <div className="flex justify-center">
              <svg width="180" height="180" viewBox="0 0 180 180">
                <circle cx="90" cy="90" r="75" fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="1" />
                <circle cx="90" cy="90" r="50" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="0.5" />
                {/* Hour labels */}
                {[0, 6, 12, 18].map((h) => {
                  const angle = (h / 24) * Math.PI * 2 - Math.PI / 2;
                  const x = 90 + Math.cos(angle) * 82;
                  const y = 90 + Math.sin(angle) * 82;
                  const labels = ["12am", "6am", "12pm", "6pm"];
                  return (
                    <text
                      key={h}
                      x={x}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="font-sans"
                      style={{ fontSize: "8px", fill: "#C0C0C0" }}
                    >
                      {labels[h / 6]}
                    </text>
                  );
                })}
                {/* Bars */}
                {timeDistribution.map((count, hour) => {
                  if (count === 0) return null;
                  const angle = (hour / 24) * Math.PI * 2 - Math.PI / 2;
                  const innerR = 30;
                  const outerR = innerR + (count / maxTimeCount) * 40;
                  const x1 = 90 + Math.cos(angle) * innerR;
                  const y1 = 90 + Math.sin(angle) * innerR;
                  const x2 = 90 + Math.cos(angle) * outerR;
                  const y2 = 90 + Math.sin(angle) * outerR;
                  return (
                    <line
                      key={hour}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke="#C9A0A0"
                      strokeWidth="5"
                      strokeLinecap="round"
                      opacity={0.3 + (count / maxTimeCount) * 0.5}
                    />
                  );
                })}
              </svg>
            </div>
          </motion.div>

          {/* Day of Week */}
          <motion.div
            custom={7}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              Weekly rhythm
            </h2>
            <p className="font-sans text-[0.7rem] text-[#ABABAB] mb-5">
              Which days feel most reflective
            </p>

            <div className="flex items-end gap-2 h-[140px] px-2">
              {dayDistribution.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                  <div className="w-full flex flex-col justify-end" style={{ height: "100px" }}>
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${maxDayCount > 0 ? (count / maxDayCount) * 100 : 0}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: "easeOut" }}
                      className="w-full rounded-t-md"
                      style={{
                        background: count > 0 ? "#A09AC9" : "rgba(0,0,0,0.04)",
                        opacity: count > 0 ? 0.3 + (count / maxDayCount) * 0.5 : 1,
                        minHeight: count > 0 ? "4px" : "2px",
                      }}
                    />
                  </div>
                  <span className="font-sans text-[0.55rem] text-[#B0B0B0]">
                    {DAY_LABELS[i]}
                  </span>
                  {count > 0 && (
                    <span className="font-sans text-[0.5rem] text-[#C0C0C0]">{count}</span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Row: Vocabulary Expansion + Source Diversity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
          {/* Vocabulary Expansion */}
          <motion.div
            custom={8}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              Vocabulary growth
            </h2>
            <p className="font-sans text-[0.7rem] text-[#ABABAB] mb-5">
              New tags introduced each week
            </p>

            {weeklyTags.length === 0 ? (
              <p className="font-sans text-[0.78rem] text-[#BDBDBD] italic">Add tagged thoughts to track growth.</p>
            ) : (
              <div className="flex items-end gap-1.5" style={{ height: "100px" }}>
                {weeklyTags.map((w, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex flex-col justify-end" style={{ height: "70px" }}>
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${(w.newCount / maxWeeklyNew) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04, ease: "easeOut" }}
                        className="w-full rounded-t-md"
                        style={{
                          background: w.newCount > 0 ? "#8FAF9A" : "rgba(0,0,0,0.04)",
                          opacity: w.newCount > 0 ? 0.5 : 1,
                          minHeight: w.newCount > 0 ? "4px" : "2px",
                        }}
                      />
                    </div>
                    <span className="font-sans text-[0.5rem] text-[#C0C0C0]">{w.newCount > 0 ? `+${w.newCount}` : ""}</span>
                    <span className="font-sans text-[0.48rem] text-[#D0D0D0]">{w.week}</span>
                  </div>
                ))}
              </div>
            )}

            {weeklyTags.length > 0 && (
              <p className="font-sans text-[0.65rem] text-[#ABABAB] mt-4">
                Total vocabulary: <span className="text-[#8FAF9A]">{weeklyTags[weeklyTags.length - 1]?.totalCount || 0} tags</span>
              </p>
            )}
          </motion.div>

          {/* Source Diversity */}
          <motion.div
            custom={9}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={glassStyle}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-1">
              Source diversity
            </h2>
            <p className="font-sans text-[0.7rem] text-[#ABABAB] mb-5">
              Where your ideas originate
            </p>

            {sourceDistribution.length === 0 ? (
              <p className="font-sans text-[0.78rem] text-[#BDBDBD] italic">
                Tag your thoughts with sources to see this.
              </p>
            ) : (
              <>
                {/* Donut chart */}
                <div className="flex justify-center mb-4">
                  <svg width="120" height="120" viewBox="0 0 120 120">
                    {(() => {
                      const total = sourceDistribution.reduce((s, d) => s + d.count, 0);
                      let cumAngle = -90;
                      const COLORS = ["#C9A0A0", "#8FAF9A", "#A09AC9", "#C9B89A", "#9AC9C0"];
                      return sourceDistribution.map((d, i) => {
                        const angle = (d.count / total) * 360;
                        const startAngle = cumAngle;
                        cumAngle += angle;
                        const startRad = (startAngle * Math.PI) / 180;
                        const endRad = ((startAngle + angle) * Math.PI) / 180;
                        const r = 45;
                        const x1 = 60 + r * Math.cos(startRad);
                        const y1 = 60 + r * Math.sin(startRad);
                        const x2 = 60 + r * Math.cos(endRad);
                        const y2 = 60 + r * Math.sin(endRad);
                        const largeArc = angle > 180 ? 1 : 0;
                        return (
                          <path
                            key={d.source}
                            d={`M 60 60 L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`}
                            fill={COLORS[i % COLORS.length]}
                            opacity={0.5}
                            stroke="white"
                            strokeWidth="2"
                          />
                        );
                      });
                    })()}
                    <circle cx="60" cy="60" r="25" fill="rgba(255,255,255,0.8)" />
                    <text x="60" y="58" textAnchor="middle" className="font-sans" style={{ fontSize: "14px", fill: "#6B6B6B" }}>
                      {sourceDistribution.length}
                    </text>
                    <text x="60" y="70" textAnchor="middle" className="font-sans" style={{ fontSize: "7px", fill: "#B0B0B0" }}>
                      sources
                    </text>
                  </svg>
                </div>
                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3">
                  {sourceDistribution.map((d, i) => {
                    const COLORS = ["#C9A0A0", "#8FAF9A", "#A09AC9", "#C9B89A", "#9AC9C0"];
                    return (
                      <div key={d.source} className="flex items-center gap-1.5">
                        <SourceIcon source={d.source} size={11} color={COLORS[i % COLORS.length]} />
                        <span className="font-sans text-[0.6rem] text-[#8A8A8A] capitalize">{d.source}</span>
                        <span className="font-sans text-[0.55rem] text-[#C0C0C0]">{d.count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Milestones */}
        {milestones.length > 0 && (
          <motion.div
            custom={10}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
            className="rounded-2xl p-7 overflow-hidden relative"
            style={{
              background: "linear-gradient(135deg, rgba(201,160,160,0.06) 0%, rgba(160,154,201,0.04) 100%)",
              backdropFilter: "blur(16px) saturate(1.2)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="font-serif italic text-[1.15rem] text-[#1C1C1E] mb-5">
              Milestones
            </h2>
            <div className="flex flex-col gap-3">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: ["#C9A0A0", "#8FAF9A", "#A09AC9"][i % 3], opacity: 0.6 }}
                  />
                  <p className="font-sans text-[0.78rem] text-[#6B6B6B] leading-[1.5]">
                    {m}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.main>
  );
}
