import { v4 as uuidv4 } from "uuid";

export interface Thought {
  id: string;
  text: string;
  tags: string[];
  createdAt: string;
  archived: boolean;
  source?: string;
  pinned?: boolean;
  seasonId?: string;
  revisitedAt?: string;
}

export interface Season {
  id: string;
  name: string;
  createdAt: string;
}

const STORAGE_KEY = "tib_thoughts";
const SEASONS_KEY = "tib_seasons";

export function getThoughts(): Thought[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveThoughts(thoughts: Thought[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(thoughts));
}

export function addThought(text: string, tags: string[], source?: string): Thought {
  const thoughts = getThoughts();
  const newThought: Thought = {
    id: uuidv4(),
    text,
    tags,
    createdAt: new Date().toISOString(),
    archived: false,
    source,
  };
  thoughts.unshift(newThought);
  saveThoughts(thoughts);
  return newThought;
}

export function updateThought(id: string, updates: Partial<Thought>): void {
  const thoughts = getThoughts();
  const index = thoughts.findIndex((t) => t.id === id);
  if (index !== -1) {
    thoughts[index] = { ...thoughts[index], ...updates };
    saveThoughts(thoughts);
  }
}

export function archiveThought(id: string): void {
  updateThought(id, { archived: true });
}

export function restoreThought(id: string): void {
  updateThought(id, { archived: false });
}

export function deleteThought(id: string): void {
  const thoughts = getThoughts().filter((t) => t.id !== id);
  saveThoughts(thoughts);
}

// --- Season CRUD ---

export function getSeasons(): Season[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(SEASONS_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveSeasons(seasons: Season[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SEASONS_KEY, JSON.stringify(seasons));
}

export function addSeason(name: string): Season {
  const seasons = getSeasons();
  const newSeason: Season = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
  };
  seasons.unshift(newSeason);
  saveSeasons(seasons);
  return newSeason;
}

export function deleteSeason(id: string): void {
  const seasons = getSeasons().filter((s) => s.id !== id);
  saveSeasons(seasons);
  // Clear seasonId from orphaned thoughts
  const thoughts = getThoughts();
  thoughts.forEach((t) => {
    if (t.seasonId === id) t.seasonId = undefined;
  });
  saveThoughts(thoughts);
}

// --- Extended thought actions ---

export function pinThought(id: string): void {
  updateThought(id, { pinned: true });
}

export function unpinThought(id: string): void {
  updateThought(id, { pinned: false });
}

export function revisitThought(id: string): void {
  updateThought(id, { revisitedAt: new Date().toISOString() });
}

// --- Tag utilities ---

export function getAllTags(): string[] {
  const thoughts = getThoughts().filter((t) => !t.archived);
  const freq: Record<string, number> = {};
  thoughts.forEach((t) => {
    t.tags.forEach((tag) => {
      freq[tag] = (freq[tag] || 0) + 1;
    });
  });
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

// --- User name ---

const USERNAME_KEY = "tib_username";

export function getUserName(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export function setUserName(name: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERNAME_KEY, name.trim());
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// --- Date formatting ---

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
