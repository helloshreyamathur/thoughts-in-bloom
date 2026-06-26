"use client";

import { motion, AnimatePresence } from "framer-motion";
import { getTagColor } from "@/lib/tags";

interface FilterBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeTagFilters: string[];
  onRemoveTagFilter: (tag: string) => void;
  onClearAll: () => void;
}

export default function FilterBar({
  searchQuery,
  onSearchChange,
  activeTagFilters,
  onRemoveTagFilter,
  onClearAll,
}: FilterBarProps) {
  const hasFilters = searchQuery.trim() !== "" || activeTagFilters.length > 0;

  return (
    <div className="flex items-center gap-2 flex-wrap min-h-[32px]">
      {/* Search input */}
      <div className="relative flex items-center">
        <svg
          width="13"
          height="13"
          viewBox="0 0 20 20"
          fill="none"
          className="absolute left-2.5 text-[#707070]"
        >
          <circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M13 13l4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search thoughts..."
          className="font-sans text-[0.75rem] text-[#6B6B6B] placeholder-[#949494] bg-[rgba(255,255,255,0.35)] rounded-lg pl-8 pr-3 py-1.5 w-[180px] focus:w-[220px] transition-all duration-200 focus:bg-[rgba(255,255,255,0.5)]"
          style={{ border: "1px solid rgba(0,0,0,0.04)" }}
        />
      </div>

      {/* Active filter pills */}
      <AnimatePresence mode="popLayout">
        {activeTagFilters.map((tag) => {
          const color = getTagColor(tag);
          return (
            <motion.button
              key={tag}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onRemoveTagFilter(tag)}
              className="font-sans text-[0.75rem] px-2.5 py-1 rounded-full tracking-[0.03em] cursor-pointer hover:brightness-90 transition-all flex items-center gap-1"
              style={{ background: color.bg, color: color.text }}
            >
              {tag}
              <span className="text-[0.75rem] leading-none opacity-60">\u00d7</span>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* Clear all */}
      <AnimatePresence>
        {hasFilters && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClearAll}
            className="font-sans text-[0.75rem] text-[#737373] hover:text-[#6B6B6B] transition-colors tracking-[0.03em]"
          >
            Clear all
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
