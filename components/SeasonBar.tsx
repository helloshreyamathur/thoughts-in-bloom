"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Season, Thought } from "@/lib/storage";

interface SeasonBarProps {
  seasons: Season[];
  activeSeasonId: string | null; // null = "All"
  thoughts: Thought[];
  onSelectSeason: (id: string | null) => void;
  onCreateSeason: (name: string) => void;
}

export default function SeasonBar({
  seasons,
  activeSeasonId,
  thoughts,
  onSelectSeason,
  onCreateSeason,
}: SeasonBarProps) {
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creating && inputRef.current) inputRef.current.focus();
  }, [creating]);

  const handleCreate = () => {
    if (newName.trim()) {
      onCreateSeason(newName.trim());
      setNewName("");
      setCreating(false);
    }
  };

  const getSeasonCount = (seasonId: string) => {
    return thoughts.filter((t) => t.seasonId === seasonId).length;
  };

  const pillStyle = (isActive: boolean) => ({
    background: isActive ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.35)",
    border: isActive
      ? "1px solid rgba(201,160,160,0.3)"
      : "1px solid rgba(0,0,0,0.04)",
    boxShadow: isActive ? "0 2px 8px rgba(0,0,0,0.04)" : "none",
  });

  if (seasons.length === 0 && !creating) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setCreating(true)}
          className="font-sans text-[0.62rem] text-[#B0B0B0] hover:text-[#8A8A8A] tracking-[0.04em] transition-colors flex items-center gap-1"
        >
          <span className="text-[0.8rem] leading-none">+</span> Create a season
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-1">
      {/* All tab */}
      <button
        onClick={() => onSelectSeason(null)}
        className="font-sans text-[0.65rem] px-3 py-1.5 rounded-full tracking-[0.03em] transition-all duration-200 flex-shrink-0 whitespace-nowrap"
        style={pillStyle(activeSeasonId === null)}
      >
        <span style={{ color: activeSeasonId === null ? "#1C1C1E" : "#8A8A8A" }}>
          All
        </span>
        <span className="ml-1.5 text-[0.55rem] text-[#B0B0B0]">
          {thoughts.length}
        </span>
      </button>

      {/* Season pills */}
      {seasons.map((season) => (
        <button
          key={season.id}
          onClick={() => onSelectSeason(season.id)}
          className="font-sans text-[0.65rem] px-3 py-1.5 rounded-full tracking-[0.03em] transition-all duration-200 flex-shrink-0 whitespace-nowrap"
          style={pillStyle(activeSeasonId === season.id)}
        >
          <span style={{ color: activeSeasonId === season.id ? "#1C1C1E" : "#8A8A8A" }}>
            {season.name}
          </span>
          <span className="ml-1.5 text-[0.55rem] text-[#B0B0B0]">
            {getSeasonCount(season.id)}
          </span>
        </button>
      ))}

      {/* Create new season */}
      <AnimatePresence>
        {creating ? (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "auto", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0"
          >
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") { setCreating(false); setNewName(""); }
              }}
              onBlur={() => { if (!newName.trim()) { setCreating(false); setNewName(""); } }}
              placeholder="Name this season..."
              className="font-sans text-[0.65rem] text-[#6B6B6B] placeholder-[#C0C0C0] bg-[rgba(255,255,255,0.5)] rounded-full px-3 py-1.5 w-[140px]"
              style={{ border: "1px solid rgba(201,160,160,0.2)" }}
            />
          </motion.div>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="font-sans text-[0.72rem] text-[#C0C0C0] hover:text-[#8A8A8A] transition-colors flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[rgba(0,0,0,0.03)]"
            title="Create season"
          >
            +
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
