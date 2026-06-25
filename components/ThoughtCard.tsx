"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, forwardRef } from "react";
import type { Thought } from "@/lib/storage";
import { formatDate } from "@/lib/storage";
import { getTagColor } from "@/lib/tags";
import { SourceIcon } from "@/components/icons/SourceIcons";

interface ConnectedThought {
  id: string;
  text: string;
  sharedTags: string[];
}

interface ThoughtCardProps {
  thought: Thought;
  onEdit?: (thought: Thought) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onPin?: (id: string) => void;
  onTagClick?: (tag: string) => void;
  isArchived?: boolean;
  index?: number;
  connectionCount?: number;
  connectedThoughts?: ConnectedThought[];
  isFocused?: boolean;
}

const ThoughtCard = forwardRef<HTMLDivElement, ThoughtCardProps>(function ThoughtCard(
  {
    thought,
    onEdit,
    onArchive,
    onRestore,
    onPin,
    onTagClick,
    isArchived = false,
    index = 0,
    connectionCount = 0,
    connectedThoughts = [],
    isFocused = false,
  },
  ref
) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Dominant tag color for left border
  const dominantTag = thought.tags[0];
  const dominantColor = dominantTag ? getTagColor(dominantTag) : null;

  // Connection dots (1-3 based on count)
  const dotCount = Math.min(Math.max(connectionCount, 0), 3);

  // Source label
  const sourceLabel = thought.source || null;

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't expand if clicking on a button or tag
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    setExpanded(!expanded);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: "easeOut" }}
      layout="position"
      whileHover={{ scale: 1.01, transition: { duration: 0.2, ease: "easeOut" } }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={handleCardClick}
      className={`relative rounded-[20px] overflow-hidden cursor-pointer ${
        isArchived ? "opacity-60 saturate-50" : ""
      }`}
      style={{
        borderTop: "1px solid rgba(255,255,255,0.5)",
        borderRight: "1px solid rgba(255,255,255,0.5)",
        borderBottom: "1px solid rgba(255,255,255,0.5)",
        borderLeft: dominantColor
          ? `3px solid ${dominantColor.text}50`
          : "1px solid rgba(255,255,255,0.5)",
        boxShadow: isFocused
          ? `0 0 0 2px rgba(201,160,160,0.4), 0 8px 40px rgba(0,0,0,0.07)`
          : hovered
          ? "0 8px 40px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)"
          : "0 2px 16px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
        transition: "box-shadow 0.25s ease-out",
        background: "rgba(255,255,255,0.65)",
        backdropFilter: "blur(16px) saturate(1.2)",
      }}
      tabIndex={0}
    >
      {/* Pin indicator */}
      {thought.pinned && (
        <div className="absolute top-3 right-3">
          <svg width="10" height="10" viewBox="0 0 16 16" fill="#C9A0A0" opacity="0.6">
            <circle cx="8" cy="3" r="2.5" />
            <path d="M8 5.5V12" stroke="#C9A0A0" strokeWidth="1.2" />
          </svg>
        </div>
      )}

      <div className="p-6">
        <p className="font-serif italic text-[1.02rem] text-[#1C1C1E] leading-[1.7] mb-4">
          {thought.text}
        </p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-[0.68rem] text-[#6B6B6B] tracking-[0.02em]">
              {formatDate(thought.createdAt)}
            </span>
            {thought.source && (
              <SourceIcon source={thought.source} size={12} color="#BDBDBD" />
            )}
            {/* Connection dots */}
            {dotCount > 0 && (
              <div className="flex items-center gap-0.5 ml-1">
                {Array.from({ length: dotCount }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: "3px",
                      height: "3px",
                      background: "#A09AC9",
                      opacity: 0.4 + i * 0.15,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 justify-end">
            {thought.tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <button
                  key={tag}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTagClick?.(tag);
                  }}
                  className="font-sans text-[0.65rem] px-2.5 py-0.5 rounded-full tracking-[0.03em] transition-all duration-150 hover:brightness-90"
                  style={{
                    background: color.bg,
                    color: color.text,
                    cursor: onTagClick ? "pointer" : "default",
                  }}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Expanded section: source label + connected thoughts */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="overflow-hidden"
            >
              <div className="pt-4 mt-4" style={{ borderTop: "1px solid rgba(0,0,0,0.04)" }}>
                {/* Source label */}
                {sourceLabel && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <SourceIcon source={sourceLabel} size={13} color="#9A9A9A" />
                    <span className="font-sans text-[0.62rem] text-[#9A9A9A] tracking-[0.04em] capitalize">
                      {sourceLabel}
                    </span>
                  </div>
                )}

                {/* Connected thoughts */}
                {connectedThoughts.length > 0 && (
                  <div>
                    <span className="font-sans text-[0.58rem] text-[#B0B0B0] tracking-[0.06em] uppercase block mb-2">
                      Connected thoughts
                    </span>
                    <div className="space-y-2">
                      {connectedThoughts.slice(0, 3).map((ct) => (
                        <div
                          key={ct.id}
                          className="rounded-xl px-3.5 py-2.5"
                          style={{
                            background: "rgba(0,0,0,0.02)",
                            border: "1px solid rgba(0,0,0,0.03)",
                          }}
                        >
                          <p className="font-serif italic text-[0.82rem] text-[#4A4A4A] leading-[1.6] line-clamp-2">
                            {ct.text}
                          </p>
                          <div className="flex items-center gap-1 mt-1.5">
                            {ct.sharedTags.map((tag) => {
                              const color = getTagColor(tag);
                              return (
                                <span
                                  key={tag}
                                  className="font-sans text-[0.55rem] px-1.5 py-0.5 rounded-full"
                                  style={{
                                    background: color.bg,
                                    color: color.text,
                                    opacity: 0.7,
                                  }}
                                >
                                  {tag}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No connections message */}
                {connectedThoughts.length === 0 && !sourceLabel && (
                  <p className="font-sans text-[0.65rem] text-[#C0C0C0] italic">
                    No connections yet — add shared tags to link thoughts together.
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hover overlay with actions */}
      <AnimatePresence>
        {(hovered || isFocused) && !expanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-0 left-0 right-0 h-11 flex items-center justify-end gap-1 px-3"
            style={{
              background:
                "linear-gradient(to top, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0) 100%)",
            }}
          >
            {!isArchived && onPin && (
              <button
                onClick={() => onPin(thought.id)}
                className="flex items-center font-sans text-[0.65rem] text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors px-1.5 py-1 rounded-lg hover:bg-[rgba(0,0,0,0.04)]"
                title={thought.pinned ? "Unpin" : "Pin"}
              >
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <circle cx="8" cy="3.5" r="2" />
                  <path d="M8 5.5V12" />
                  <path d="M5.5 12h5" />
                </svg>
                <span className="ml-0.5">{thought.pinned ? "Unpin" : "Pin"}</span>
              </button>
            )}
            {!isArchived && onEdit && (
              <button
                onClick={() => onEdit(thought)}
                className="flex items-center font-sans text-[0.65rem] text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors px-1.5 py-1 rounded-lg hover:bg-[rgba(0,0,0,0.04)]"
                title="Edit"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                <span className="ml-0.5">Edit</span>
              </button>
            )}
            {!isArchived && onArchive && (
              <button
                onClick={() => onArchive(thought.id)}
                className="flex items-center font-sans text-[0.65rem] text-[#6B6B6B] hover:text-[#1C1C1E] transition-colors px-1.5 py-1 rounded-lg hover:bg-[rgba(0,0,0,0.04)]"
                title="Archive"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polyline points="21 8 21 21 3 21 3 8" />
                  <rect x="1" y="3" width="22" height="5" />
                  <line x1="10" y1="12" x2="14" y2="12" />
                </svg>
                <span className="ml-0.5">Archive</span>
              </button>
            )}
            {isArchived && onRestore && (
              <button
                onClick={() => onRestore(thought.id)}
                className="font-sans text-[0.65rem] text-[#8FAF9A] hover:text-[#6B9A7E] transition-colors px-2 py-1 rounded-lg hover:bg-[rgba(143,175,154,0.08)] tracking-[0.03em]"
              >
                Restore
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});

export default ThoughtCard;
