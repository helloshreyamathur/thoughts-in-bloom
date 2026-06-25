// Insights computation engine — all pure functions, no side effects

import type { Thought } from "@/lib/storage";

// --- Types ---

export interface WeekBucket {
  weekLabel: string;
  startDate: Date;
  tags: Record<string, number>;
  thoughtCount: number;
}

export interface GrowthDepthSignal {
  ratio: number; // 0 = all deepening, 1 = all exploring
  newTags: string[];
  recurringTags: string[];
  sentence: string;
}

export interface ThoughtArc {
  tag: string;
  thoughts: Thought[];
  firstSnippet: string;
  latestSnippet: string;
  sentence: string;
}

export interface SourcePattern {
  source: string;
  count: number;
  avgConnections: number;
  topTags: string[];
}

export interface SourceInsight {
  patterns: SourcePattern[];
  sentence: string;
}

export interface SmartPrompt {
  label: string; // e.g. "UNEXPLORED CONNECTION"
  prompt: string;
}

// --- Helper ---

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

function snippet(text: string, wordCount = 10): string {
  const words = text.split(/\s+/);
  if (words.length <= wordCount) return text;
  return words.slice(0, wordCount).join(" ") + "…";
}

// --- 1. Weekly Buckets (Evolution Timeline) ---

export function getWeeklyBuckets(thoughts: Thought[], weekCount = 8): WeekBucket[] {
  const now = new Date();
  const currentMonday = getMonday(now);

  const buckets: WeekBucket[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const start = new Date(currentMonday);
    start.setDate(start.getDate() - i * 7);
    buckets.push({
      weekLabel: formatWeekLabel(start),
      startDate: start,
      tags: {},
      thoughtCount: 0,
    });
  }

  thoughts.forEach((t) => {
    const created = new Date(t.createdAt);
    for (let i = 0; i < buckets.length; i++) {
      const bucketStart = buckets[i].startDate;
      const bucketEnd = new Date(bucketStart);
      bucketEnd.setDate(bucketEnd.getDate() + 7);
      if (created >= bucketStart && created < bucketEnd) {
        buckets[i].thoughtCount++;
        t.tags.forEach((tag) => {
          buckets[i].tags[tag] = (buckets[i].tags[tag] || 0) + 1;
        });
        break;
      }
    }
  });

  return buckets;
}

// --- 2. Growth vs Depth ---

export function getGrowthDepthSignal(thoughts: Thought[]): GrowthDepthSignal {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const thisWeek = thoughts.filter((t) => new Date(t.createdAt) > weekAgo);
  const prior = thoughts.filter((t) => new Date(t.createdAt) <= weekAgo);

  const thisWeekTags = new Set<string>();
  thisWeek.forEach((t) => t.tags.forEach((tag) => thisWeekTags.add(tag)));

  const priorTags = new Set<string>();
  prior.forEach((t) => t.tags.forEach((tag) => priorTags.add(tag)));

  const newTags: string[] = [];
  const recurringTags: string[] = [];

  thisWeekTags.forEach((tag) => {
    if (priorTags.has(tag)) {
      recurringTags.push(tag);
    } else {
      newTags.push(tag);
    }
  });

  const total = newTags.length + recurringTags.length;
  const ratio = total === 0 ? 0.5 : newTags.length / total;

  let sentence: string;
  if (total === 0) {
    sentence = "No thoughts this week yet — your garden is waiting.";
  } else if (ratio > 0.6) {
    sentence = `You're exploring new ground — ${newTags.length} new theme${newTags.length !== 1 ? "s" : ""} appeared this week.`;
  } else if (ratio < 0.3) {
    sentence = `You're going deeper — ${recurringTags.length} of ${total} themes revisit familiar territory.`;
  } else {
    sentence = `A balanced week — mixing ${newTags.length} new theme${newTags.length !== 1 ? "s" : ""} with ${recurringTags.length} familiar one${recurringTags.length !== 1 ? "s" : ""}.`;
  }

  return { ratio, newTags, recurringTags, sentence };
}

// --- 3. Thought Arcs ---

export function getThoughtArcs(thoughts: Thought[], minThoughts = 2): ThoughtArc[] {
  // Group thoughts by tag
  const tagGroups: Record<string, Thought[]> = {};
  thoughts.forEach((t) => {
    t.tags.forEach((tag) => {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(t);
    });
  });

  const arcs: ThoughtArc[] = [];

  Object.entries(tagGroups).forEach(([tag, tagThoughts]) => {
    if (tagThoughts.length < minThoughts) return;

    // Sort chronologically
    const sorted = [...tagThoughts].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const first = sorted[0];
    const latest = sorted[sorted.length - 1];
    const firstSnippet = snippet(first.text, 8);
    const latestSnippet = snippet(latest.text, 8);

    let sentence: string;
    if (sorted.length === 1) {
      sentence = `A single thought on ${tag} — waiting to become a story.`;
    } else if (first.id === latest.id) {
      sentence = `One thought carries ${tag}.`;
    } else {
      sentence = `First: "${firstSnippet}" → Latest: "${latestSnippet}"`;
    }

    arcs.push({ tag, thoughts: sorted, firstSnippet, latestSnippet, sentence });
  });

  // Sort by thought count descending
  arcs.sort((a, b) => b.thoughts.length - a.thoughts.length);

  return arcs.slice(0, 4);
}

// --- 4. Source Patterns ---

export function getSourcePatterns(thoughts: Thought[]): SourceInsight {
  const sourceGroups: Record<string, Thought[]> = {};
  thoughts.forEach((t) => {
    const src = t.source || "untagged";
    if (!sourceGroups[src]) sourceGroups[src] = [];
    sourceGroups[src].push(t);
  });

  const patterns: SourcePattern[] = [];

  Object.entries(sourceGroups).forEach(([source, srcThoughts]) => {
    if (source === "untagged") return;

    // Compute avg connections: for each thought, how many other thoughts share tags
    let totalConnections = 0;
    srcThoughts.forEach((t) => {
      let connections = 0;
      thoughts.forEach((other) => {
        if (other.id === t.id) return;
        const shared = t.tags.filter((tag) => other.tags.includes(tag)).length;
        if (shared > 0) connections++;
      });
      totalConnections += connections;
    });

    const avgConnections = srcThoughts.length > 0 ? totalConnections / srcThoughts.length : 0;

    // Top tags for this source
    const tagFreq: Record<string, number> = {};
    srcThoughts.forEach((t) => {
      t.tags.forEach((tag) => {
        tagFreq[tag] = (tagFreq[tag] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([tag]) => tag);

    patterns.push({ source, count: srcThoughts.length, avgConnections, topTags });
  });

  patterns.sort((a, b) => b.count - a.count);

  // Generate sentence
  let sentence = "";
  if (patterns.length >= 2) {
    const sorted = [...patterns].sort((a, b) => b.avgConnections - a.avgConnections);
    const most = sorted[0];
    const least = sorted[sorted.length - 1];
    if (most.avgConnections > 0 && least.avgConnections < most.avgConnections) {
      if (least.avgConnections > 0) {
        const ratio = (most.avgConnections / least.avgConnections).toFixed(1);
        sentence = `Your ${most.source}-inspired thoughts spark ${ratio}× more connections than ${least.source}s.`;
      } else {
        sentence = `Your ${most.source}-inspired thoughts are the most connected — averaging ${most.avgConnections.toFixed(1)} connections each.`;
      }
    } else {
      sentence = `You draw most from ${most.source}s — ${most.count} thought${most.count !== 1 ? "s" : ""} and counting.`;
    }
  } else if (patterns.length === 1) {
    sentence = `All your sourced thoughts come from ${patterns[0].source}s. What might other sources reveal?`;
  } else {
    sentence = "Add source tags to your thoughts to see where your ideas come from.";
  }

  return { patterns, sentence };
}

// --- 5. Smart Reflection Prompts ---

export function getSmartPrompts(thoughts: Thought[], count = 3): SmartPrompt[] {
  const prompts: SmartPrompt[] = [];

  // Compute tag frequencies
  const tagFreq: Record<string, number> = {};
  thoughts.forEach((t) => t.tags.forEach((tag) => (tagFreq[tag] = (tagFreq[tag] || 0) + 1)));
  const frequentTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);

  if (frequentTags.length < 2) {
    // Fallback for new users
    return [
      { label: "REFLECTION", prompt: "What thought has been following you this week?" },
      { label: "REFLECTION", prompt: "What are you trying to understand right now?" },
      { label: "REFLECTION", prompt: "What question feels most alive for you today?" },
    ];
  }

  // Pattern 1: Never co-occurring frequent tags
  const coOccurrence: Record<string, Set<string>> = {};
  thoughts.forEach((t) => {
    for (let i = 0; i < t.tags.length; i++) {
      for (let j = i + 1; j < t.tags.length; j++) {
        const key = t.tags[i];
        const other = t.tags[j];
        if (!coOccurrence[key]) coOccurrence[key] = new Set();
        if (!coOccurrence[other]) coOccurrence[other] = new Set();
        coOccurrence[key].add(other);
        coOccurrence[other].add(key);
      }
    }
  });

  const topN = frequentTags.slice(0, 8);
  for (let i = 0; i < topN.length && prompts.length === 0; i++) {
    for (let j = i + 1; j < topN.length; j++) {
      const a = topN[i];
      const b = topN[j];
      if (!coOccurrence[a]?.has(b)) {
        prompts.push({
          label: "UNEXPLORED CONNECTION",
          prompt: `You think about ${a} and ${b} separately — what would happen if they met?`,
        });
        break;
      }
    }
  }

  // Pattern 2: Source bias
  const tagSources: Record<string, Record<string, number>> = {};
  thoughts.forEach((t) => {
    if (!t.source) return;
    t.tags.forEach((tag) => {
      if (!tagSources[tag]) tagSources[tag] = {};
      tagSources[tag][t.source!] = (tagSources[tag][t.source!] || 0) + 1;
    });
  });

  const allSources = ["book", "conversation", "observation", "dream", "question"];
  for (const tag of frequentTags.slice(0, 6)) {
    if (prompts.length >= 2) break;
    const sources = tagSources[tag];
    if (!sources) continue;
    const usedSources = Object.keys(sources);
    if (usedSources.length === 1 && tagFreq[tag] >= 2) {
      const used = usedSources[0];
      const unused = allSources.filter((s) => s !== used);
      if (unused.length > 0) {
        const suggest = unused[Math.floor(Math.random() * unused.length)];
        prompts.push({
          label: "SOURCE PATTERN",
          prompt: `Your thoughts on ${tag} always come from ${used}s. What would a ${suggest} teach you about it?`,
        });
      }
    }
  }

  // Pattern 3: Rising tag (appeared more this week than usual)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const thisWeekFreq: Record<string, number> = {};
  const lastWeekFreq: Record<string, number> = {};
  thoughts.forEach((t) => {
    const d = new Date(t.createdAt);
    if (d > weekAgo) {
      t.tags.forEach((tag) => (thisWeekFreq[tag] = (thisWeekFreq[tag] || 0) + 1));
    } else if (d > twoWeeksAgo) {
      t.tags.forEach((tag) => (lastWeekFreq[tag] = (lastWeekFreq[tag] || 0) + 1));
    }
  });

  if (prompts.length < count) {
    for (const [tag, thisCount] of Object.entries(thisWeekFreq)) {
      const lastCount = lastWeekFreq[tag] || 0;
      if (thisCount >= 2 && thisCount > lastCount) {
        prompts.push({
          label: "RISING THEME",
          prompt: `${tag} appeared ${thisCount} time${thisCount !== 1 ? "s" : ""} this week${lastCount > 0 ? `, up from ${lastCount}` : ", brand new"}. What's drawing you there?`,
        });
        break;
      }
    }
  }

  // Pattern 4: Dormant tag
  if (prompts.length < count) {
    const lastSeen: Record<string, Date> = {};
    thoughts.forEach((t) => {
      const d = new Date(t.createdAt);
      t.tags.forEach((tag) => {
        if (!lastSeen[tag] || d > lastSeen[tag]) lastSeen[tag] = d;
      });
    });

    const now = new Date();
    const dormant = Object.entries(lastSeen)
      .filter(([tag, date]) => {
        const days = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
        return days > 14 && tagFreq[tag] >= 2;
      })
      .sort((a, b) => tagFreq[b[0]] - tagFreq[a[0]]);

    if (dormant.length > 0) {
      const [tag, date] = dormant[0];
      const days = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      prompts.push({
        label: "DORMANT THREAD",
        prompt: `You haven't returned to ${tag} in ${days} days. Has it finished speaking, or is it waiting?`,
      });
    }
  }

  // Pattern 5: Always co-occurring
  if (prompts.length < count) {
    for (let i = 0; i < topN.length; i++) {
      if (prompts.length >= count) break;
      for (let j = i + 1; j < topN.length; j++) {
        const a = topN[i];
        const b = topN[j];
        // Check if they always appear together
        const aThoughts = thoughts.filter((t) => t.tags.includes(a));
        const bThoughts = thoughts.filter((t) => t.tags.includes(b));
        const bothThoughts = thoughts.filter(
          (t) => t.tags.includes(a) && t.tags.includes(b)
        );
        if (
          aThoughts.length >= 2 &&
          bThoughts.length >= 2 &&
          bothThoughts.length === aThoughts.length &&
          bothThoughts.length === bThoughts.length
        ) {
          prompts.push({
            label: "INSEPARABLE PAIR",
            prompt: `${a} and ${b} always appear together in your thinking. Can they exist apart?`,
          });
          break;
        }
      }
    }
  }

  // Fallback to fill remaining slots
  const fallbacks: SmartPrompt[] = [
    { label: "REFLECTION", prompt: "What thought has been following you this week?" },
    { label: "REFLECTION", prompt: "What are you trying to understand right now?" },
    { label: "REFLECTION", prompt: "What question feels most alive for you today?" },
    { label: "REFLECTION", prompt: "What would you tell your past self about what you know now?" },
  ];

  while (prompts.length < count) {
    const fb = fallbacks[prompts.length % fallbacks.length];
    if (!prompts.find((p) => p.prompt === fb.prompt)) {
      prompts.push(fb);
    } else {
      break;
    }
  }

  return prompts.slice(0, count);
}
