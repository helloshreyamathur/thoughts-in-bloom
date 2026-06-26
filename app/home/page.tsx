"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThoughtCard from "@/components/ThoughtCard";
import MasonryGrid from "@/components/MasonryGrid";
import CaptureBar from "@/components/CaptureBar";
import FilterBar from "@/components/FilterBar";
import SeasonBar from "@/components/SeasonBar";
import { getTagColor } from "@/lib/tags";
import {
  getThoughts,
  addThought,
  archiveThought,
  restoreThought,
  updateThought,
  pinThought,
  unpinThought,
  getSeasons,
  addSeason,
  formatFullDate,
  getUserName,
  setUserName,
  getGreeting,
  type Thought,
  type Season,
} from "@/lib/storage";

export default function HomePage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [activeSeasonId, setActiveSeasonId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [editingThought, setEditingThought] = useState<Thought | null>(null);
  const [editText, setEditText] = useState("");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editTagInput, setEditTagInput] = useState("");
  const [editSeasonId, setEditSeasonId] = useState<string | undefined>(undefined);
  const [mounted, setMounted] = useState(false);
  const [undoThought, setUndoThought] = useState<Thought | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const [userName, setUserNameState] = useState<string | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const today = formatFullDate(new Date());
  const greeting = getGreeting();

  useEffect(() => {
    setThoughts(getThoughts().filter((t) => !t.archived));
    setSeasons(getSeasons());
    const name = getUserName();
    setUserNameState(name);
    if (!name) setShowNamePrompt(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (showNamePrompt && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showNamePrompt]);

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setUserNameState(nameInput.trim());
      setShowNamePrompt(false);
    }
  };

  // Auto-dismiss undo toast
  useEffect(() => {
    if (!undoThought) return;
    const timer = setTimeout(() => setUndoThought(null), 5000);
    return () => clearTimeout(timer);
  }, [undoThought]);

  const refreshThoughts = useCallback(() => {
    setThoughts(getThoughts().filter((t) => !t.archived));
  }, []);

  // --- Filtering & sorting ---

  // Build connection counts: how many other thoughts share tags with each
  const connectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    thoughts.forEach((t) => {
      counts[t.id] = 0;
    });
    for (let i = 0; i < thoughts.length; i++) {
      for (let j = i + 1; j < thoughts.length; j++) {
        const shared = thoughts[i].tags.filter((tag) => thoughts[j].tags.includes(tag)).length;
        if (shared > 0) {
          counts[thoughts[i].id] = (counts[thoughts[i].id] || 0) + 1;
          counts[thoughts[j].id] = (counts[thoughts[j].id] || 0) + 1;
        }
      }
    }
    return counts;
  }, [thoughts]);

  // Build connected thoughts map: for each thought, top 3 thoughts sharing tags
  const connectedThoughtsMap = useMemo(() => {
    const map: Record<string, { id: string; text: string; sharedTags: string[] }[]> = {};
    thoughts.forEach((t) => {
      const connections: { id: string; text: string; sharedTags: string[]; count: number }[] = [];
      thoughts.forEach((other) => {
        if (other.id === t.id) return;
        const shared = t.tags.filter((tag) => other.tags.includes(tag));
        if (shared.length > 0) {
          connections.push({ id: other.id, text: other.text, sharedTags: shared, count: shared.length });
        }
      });
      connections.sort((a, b) => b.count - a.count);
      map[t.id] = connections.slice(0, 3).map(({ id, text, sharedTags }) => ({ id, text, sharedTags }));
    });
    return map;
  }, [thoughts]);

  const filteredThoughts = useMemo(() => {
    let result = thoughts;

    // Season filter
    if (activeSeasonId) {
      result = result.filter((t) => t.seasonId === activeSeasonId);
    }

    // Tag filters (AND logic)
    if (activeTagFilters.length > 0) {
      result = result.filter((t) =>
        activeTagFilters.every((filter) => t.tags.includes(filter))
      );
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.text.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.includes(q))
      );
    }

    // Sort: pinned first, then by createdAt descending
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return bTime - aTime;
    });

    return result;
  }, [thoughts, activeSeasonId, activeTagFilters, searchQuery]);

  // Reset focus when filters change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [activeSeasonId, activeTagFilters, searchQuery]);

  // --- Keyboard navigation ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle keyboard nav when typing in inputs/textareas or in edit modal
      const active = document.activeElement;
      if (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        editingThought
      ) {
        return;
      }

      const count = filteredThoughts.length;
      if (count === 0) return;

      switch (e.key) {
        case "j": {
          e.preventDefault();
          const next = focusedIndex < count - 1 ? focusedIndex + 1 : 0;
          setFocusedIndex(next);
          cardRefs.current[next]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          break;
        }
        case "k": {
          e.preventDefault();
          const prev = focusedIndex > 0 ? focusedIndex - 1 : count - 1;
          setFocusedIndex(prev);
          cardRefs.current[prev]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
          break;
        }
        case "e": {
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            openEdit(filteredThoughts[focusedIndex]);
          }
          break;
        }
        case "a": {
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            handleArchive(filteredThoughts[focusedIndex].id);
            // Adjust focus index
            if (focusedIndex >= count - 1) {
              setFocusedIndex(Math.max(0, count - 2));
            }
          }
          break;
        }
        case "p": {
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            handlePin(filteredThoughts[focusedIndex].id);
          }
          break;
        }
        case "Enter": {
          if (focusedIndex >= 0 && focusedIndex < count) {
            e.preventDefault();
            // Simulate click on the card to toggle expand
            cardRefs.current[focusedIndex]?.click();
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          setFocusedIndex(-1);
          break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIndex, filteredThoughts, editingThought]);

  // --- Actions ---

  const handleBloom = (text: string, tags: string[], source?: string) => {
    addThought(text, tags, source);
    // If there's an active season, assign it
    if (activeSeasonId) {
      const allThoughts = getThoughts();
      const newest = allThoughts[0]; // addThought prepends
      if (newest) {
        updateThought(newest.id, { seasonId: activeSeasonId });
      }
    }
    refreshThoughts();
  };

  const handleArchive = (id: string) => {
    const thought = thoughts.find((t) => t.id === id);
    archiveThought(id);
    refreshThoughts();
    if (thought) setUndoThought(thought);
  };

  const handleUndo = () => {
    if (!undoThought) return;
    restoreThought(undoThought.id);
    refreshThoughts();
    setUndoThought(null);
  };

  const handlePin = (id: string) => {
    const thought = thoughts.find((t) => t.id === id);
    if (thought?.pinned) {
      unpinThought(id);
    } else {
      pinThought(id);
    }
    refreshThoughts();
  };

  const handleTagClick = (tag: string) => {
    if (!activeTagFilters.includes(tag)) {
      setActiveTagFilters([...activeTagFilters, tag]);
    }
  };

  const handleRemoveTagFilter = (tag: string) => {
    setActiveTagFilters(activeTagFilters.filter((t) => t !== tag));
  };

  const handleClearAll = () => {
    setSearchQuery("");
    setActiveTagFilters([]);
  };

  const handleCreateSeason = (name: string) => {
    addSeason(name);
    setSeasons(getSeasons());
  };

  // --- Edit modal ---

  const openEdit = (thought: Thought) => {
    setEditingThought(thought);
    setEditText(thought.text);
    setEditTags(thought.tags);
    setEditSeasonId(thought.seasonId);
  };

  const saveEdit = () => {
    if (!editingThought || !editText.trim()) return;
    updateThought(editingThought.id, {
      text: editText.trim(),
      tags: editTags,
      seasonId: editSeasonId,
    });
    refreshThoughts();
    setEditingThought(null);
  };

  const handleEditTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && editTagInput.trim()) {
      e.preventDefault();
      const newTag = editTagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (!editTags.includes(newTag)) setEditTags([...editTags, newTag]);
      setEditTagInput("");
    }
    if (e.key === "Backspace" && !editTagInput && editTags.length > 0) {
      setEditTags(editTags.slice(0, -1));
    }
  };

  // Track flat index for masonry (round-robin distributes cards, so we need to map)
  let flatIndex = 0;

  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
      className="min-h-screen pt-24 md:pt-28 pb-24 px-5 md:px-8"
    >
      {/* Header — personalized greeting */}
      <div className="max-w-[720px] mx-auto mb-6 relative">
        <div
          className="absolute -top-16 -right-32 w-[350px] h-[350px] pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(201,160,160,0.08) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="flex items-baseline justify-between"
        >
          {showNamePrompt && !userName ? (
            <div className="flex items-baseline gap-2">
              <h1 className="font-serif italic text-[1.6rem] md:text-[1.9rem] text-[#1C1C1E] leading-[1.2] tracking-[-0.02em] font-light">
                {greeting},
              </h1>
              <input
                ref={nameInputRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleNameSubmit();
                }}
                onBlur={() => {
                  if (nameInput.trim()) handleNameSubmit();
                }}
                placeholder="what's your name?"
                className="font-serif italic text-[1.6rem] md:text-[1.9rem] text-[#1C1C1E] leading-[1.2] tracking-[-0.02em] font-light bg-transparent border-b border-[rgba(201,160,160,0.3)] pb-0.5 w-[200px] placeholder-[#707070]"
              />
            </div>
          ) : (
            <h1 className="font-serif italic text-[1.6rem] md:text-[1.9rem] text-[#1C1C1E] leading-[1.2] tracking-[-0.02em] font-light">
              {greeting}{userName ? `, ${userName}` : ""}
            </h1>
          )}
          <p className="font-sans text-[0.75rem] text-[#737373] tracking-[0.04em]">
            {today}
          </p>
        </motion.div>
      </div>

      {/* Capture Bar */}
      <div className="max-w-[720px] mx-auto mb-5">
        <CaptureBar
          onBloom={handleBloom}
          seasonId={activeSeasonId ?? undefined}
          seasons={seasons}
          onSeasonChange={(id) => setActiveSeasonId(id ?? null)}
        />
      </div>

      {/* Season Bar + Filter Bar */}
      <div className="max-w-[1100px] mx-auto mb-5 space-y-3">
        <SeasonBar
          seasons={seasons}
          activeSeasonId={activeSeasonId}
          thoughts={thoughts}
          onSelectSeason={setActiveSeasonId}
          onCreateSeason={handleCreateSeason}
        />
        <FilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTagFilters={activeTagFilters}
          onRemoveTagFilter={handleRemoveTagFilter}
          onClearAll={handleClearAll}
        />
      </div>

      {/* Keyboard hint */}
      {mounted && filteredThoughts.length > 0 && focusedIndex === -1 && (
        <div className="max-w-[1100px] mx-auto mb-3">
          <p className="font-sans text-[0.75rem] text-[#707070] tracking-[0.04em]">
            Press <kbd className="px-1 py-0.5 rounded text-[0.75rem] bg-[rgba(0,0,0,0.04)] text-[#737373]">j</kbd> / <kbd className="px-1 py-0.5 rounded text-[0.75rem] bg-[rgba(0,0,0,0.04)] text-[#737373]">k</kbd> to navigate
          </p>
        </div>
      )}

      {/* Thought Cards */}
      <div className="max-w-[1100px] mx-auto">
        {!mounted ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-[20px] h-36 animate-pulse"
                style={{
                  background: "rgba(255,255,255,0.4)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
            ))}
          </div>
        ) : filteredThoughts.length === 0 ? (
          <div className="text-center py-16 relative">
            <div
              className="mx-auto w-[120px] h-[120px] mb-5"
              style={{
                background: "radial-gradient(circle, rgba(201,160,160,0.10) 0%, transparent 70%)",
                filter: "blur(25px)",
              }}
            />
            {thoughts.length === 0 ? (
              <>
                <p className="font-sans text-[1.05rem] text-[#707070] mb-2">
                  Your garden is waiting for its first thought.
                </p>
                <p className="font-sans text-[0.75rem] text-[#707070]">
                  Write something above to begin.
                </p>
              </>
            ) : (
              <>
                <p className="font-sans text-[1.05rem] text-[#707070] mb-2">
                  No thoughts match your filters.
                </p>
                <button
                  onClick={handleClearAll}
                  className="font-sans text-[0.75rem] text-[#C9A0A0] hover:text-[#B08080] transition-colors"
                >
                  Clear all filters
                </button>
              </>
            )}
          </div>
        ) : (
          <MasonryGrid>
            {filteredThoughts.map((thought, i) => (
              <ThoughtCard
                key={thought.id}
                ref={(el) => { cardRefs.current[i] = el; }}
                thought={thought}
                index={i}
                onEdit={openEdit}
                onArchive={handleArchive}
                onPin={handlePin}
                onTagClick={handleTagClick}
                connectionCount={connectionCounts[thought.id] || 0}
                connectedThoughts={connectedThoughtsMap[thought.id] || []}
                isFocused={focusedIndex === i}
              />
            ))}
          </MasonryGrid>
        )}
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingThought && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{
              background: "rgba(250,250,248,0.75)",
              backdropFilter: "blur(12px)",
            }}
            onClick={(e) => e.target === e.currentTarget && setEditingThought(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
              className="w-full max-w-lg rounded-[20px] p-7 md:p-8 relative overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.75)",
                backdropFilter: "blur(20px) saturate(1.3)",
                border: "1px solid rgba(255,255,255,0.6)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.04)",
              }}
            >
              <div
                className="absolute -top-10 -right-10 w-[200px] h-[200px] pointer-events-none"
                style={{
                  background: "radial-gradient(circle, rgba(160,154,201,0.08) 0%, transparent 70%)",
                  filter: "blur(40px)",
                }}
              />
              <h3 className="font-serif italic text-[1.3rem] text-[#1C1C1E] mb-5 relative">
                Edit thought
              </h3>
              <textarea
                value={editText}
                onChange={(e) => {
                  if (e.target.value.length <= 280) setEditText(e.target.value);
                }}
                className="w-full font-sans text-[1rem] text-[#1C1C1E] bg-transparent resize-none leading-[1.75] pb-3 relative"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}
                rows={4}
              />
              <div className="mt-4 mb-2">
                <span className="font-sans text-[0.75rem] text-[#6B6B6B] tracking-[0.08em] uppercase mb-2 block">
                  Tags
                </span>
                <div className="flex flex-wrap items-center gap-1.5 pb-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                  {editTags.map((tag) => {
                    const color = getTagColor(tag);
                    return (
                      <span
                        key={tag}
                        className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] cursor-pointer hover:brightness-95 transition-all"
                        style={{ background: color.bg, color: color.text }}
                        onClick={() => setEditTags(editTags.filter((t) => t !== tag))}
                      >
                        {tag} ×
                      </span>
                    );
                  })}
                  <input
                    type="text"
                    value={editTagInput}
                    onChange={(e) => setEditTagInput(e.target.value)}
                    onKeyDown={handleEditTagKeyDown}
                    placeholder="Add tags..."
                    className="font-sans text-[0.75rem] text-[#6B6B6B] bg-transparent flex-1 min-w-[80px]"
                  />
                </div>
              </div>

              {/* Season selector in edit modal */}
              {seasons.length > 0 && (
                <div className="mt-3 mb-2">
                  <span className="font-sans text-[0.75rem] text-[#6B6B6B] tracking-[0.08em] uppercase mb-2 block">
                    Season
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => setEditSeasonId(undefined)}
                      className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all"
                      style={{
                        background: !editSeasonId ? "rgba(201,160,160,0.15)" : "rgba(0,0,0,0.03)",
                        color: !editSeasonId ? "#C9A0A0" : "#737373",
                      }}
                    >
                      None
                    </button>
                    {seasons.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setEditSeasonId(s.id)}
                        className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] transition-all"
                        style={{
                          background: editSeasonId === s.id ? "rgba(201,160,160,0.15)" : "rgba(0,0,0,0.03)",
                          color: editSeasonId === s.id ? "#C9A0A0" : "#737373",
                        }}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-5 relative">
                <button
                  onClick={() => setEditingThought(null)}
                  className="font-sans text-[0.78rem] text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors px-4 py-2 rounded-xl hover:bg-[rgba(0,0,0,0.03)]"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEdit}
                  className="font-sans text-[0.78rem] text-white px-5 py-2 rounded-xl transition-all hover:opacity-90"
                  style={{ background: "#1C1C1E" }}
                >
                  Save changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo toast */}
      <AnimatePresence>
        {undoThought && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 px-5 py-3 rounded-2xl"
            style={{
              background: "rgba(255,255,255,0.8)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.5)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
            }}
          >
            <span className="font-sans text-[0.78rem] text-[#6B6B6B]">
              Thought archived.
            </span>
            <button
              onClick={handleUndo}
              className="font-sans text-[0.78rem] text-[#C9A0A0] hover:text-[#B08080] transition-colors font-medium"
            >
              Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.main>
  );
}
