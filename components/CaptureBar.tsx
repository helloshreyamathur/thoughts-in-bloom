"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getTagColor } from "@/lib/tags";
import { SOURCE_TYPES } from "@/lib/tags";
import { getWritingPrompt } from "@/lib/prompts";
import { getAllTags, type Season } from "@/lib/storage";
import {
  BookIcon,
  ConversationIcon,
  ObservationIcon,
  DreamIcon,
  QuestionIcon,
} from "@/components/icons/SourceIcons";

const SOURCE_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  book: BookIcon,
  conversation: ConversationIcon,
  observation: ObservationIcon,
  dream: DreamIcon,
  question: QuestionIcon,
};

interface CaptureBarProps {
  onBloom: (text: string, tags: string[], source?: string) => void;
  seasonId?: string;
  seasons?: Season[];
  onSeasonChange?: (seasonId: string | undefined) => void;
}

export default function CaptureBar({ onBloom, seasonId, seasons = [], onSeasonChange }: CaptureBarProps) {
  const [text, setText] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [focused, setFocused] = useState(false);
  const [blooming, setBlooming] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [showSeasonPicker, setShowSeasonPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seasonPickerRef = useRef<HTMLDivElement>(null);

  // Rotating prompts
  useEffect(() => {
    const recentTags = getAllTags();
    setPrompt(getWritingPrompt(recentTags));
    const interval = setInterval(() => {
      setPrompt(getWritingPrompt(recentTags));
    }, 9000);
    return () => clearInterval(interval);
  }, []);

  // Close season picker on outside click
  useEffect(() => {
    if (!showSeasonPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (seasonPickerRef.current && !seasonPickerRef.current.contains(e.target as Node)) {
        setShowSeasonPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showSeasonPicker]);

  const handleSubmit = useCallback(() => {
    if (!text.trim() || blooming) return;
    setBlooming(true);

    setTimeout(() => {
      onBloom(text.trim(), tags, source);
      setText("");
      setTags([]);
      setTagInput("");
      setSource(undefined);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
      setTimeout(() => setBlooming(false), 300);
    }, 200);
  }, [text, tags, source, blooming, onBloom]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
      if (!tags.includes(newTag)) setTags([...tags, newTag]);
      setTagInput("");
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags(tags.slice(0, -1));
    }
  };

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  };

  const charCountColor =
    text.length >= 275 ? "#C97070" : text.length > 240 ? "#C9A0A0" : "#737373";

  const activeSeason = seasons.find((s) => s.id === seasonId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
    >
      <div
        className="relative rounded-[16px] transition-all duration-300"
        style={{
          padding: focused ? "16px 20px 12px" : "12px 20px 10px",
          background: focused ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
          backdropFilter: "blur(16px) saturate(1.2)",
          border: focused
            ? "1px solid rgba(201,160,160,0.3)"
            : "1px solid rgba(255,255,255,0.5)",
          boxShadow: focused
            ? "0 6px 32px rgba(0,0,0,0.05)"
            : "0 2px 12px rgba(0,0,0,0.02)",
        }}
      >
        {/* Main row: textarea + bloom button */}
        <div className="flex items-start gap-3">
          <div className="flex-1 relative">
            {/* Rotating prompt placeholder */}
            {!text && (
              <AnimatePresence mode="wait">
                <motion.span
                  key={prompt}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.3 }}
                  className="absolute top-0 left-0 font-sans text-[0.95rem] text-[#707070] pointer-events-none leading-[1.6]"
                >
                  {prompt}
                </motion.span>
              </AnimatePresence>
            )}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= 280) {
                  setText(e.target.value);
                  autoResize(e.target);
                }
              }}
              onKeyDown={handleTextareaKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              aria-label="Write a new thought"
              className="w-full font-sans text-[0.95rem] text-[#1C1C1E] bg-transparent resize-none leading-[1.6]"
              rows={1}
              style={{ minHeight: "26px", maxHeight: "80px" }}
            />
          </div>

          {/* Bloom button */}
          <div className="relative flex-shrink-0 mt-0.5">
            <AnimatePresence>
              {blooming && (
                <motion.div
                  initial={{ scale: 0, opacity: 0.35 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{ background: "radial-gradient(circle, rgba(201,160,160,0.4) 0%, transparent 70%)" }}
                />
              )}
            </AnimatePresence>
            <motion.button
              onClick={handleSubmit}
              whileHover={{ x: 1 }}
              whileTap={{ scale: 0.97 }}
              disabled={!text.trim() || blooming}
              className="font-sans text-[0.72rem] text-[#1C1C1E] tracking-[0.04em] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200"
            >
              {blooming ? "Bloomed \u2713" : "Bloom \u2192"}
            </motion.button>
          </div>
        </div>

        {/* Bottom row: tags + source + season + character count */}
        <div
          className="flex items-center gap-2 mt-2 pt-2 flex-wrap"
          style={{ borderTop: focused ? "1px solid rgba(0,0,0,0.04)" : "1px solid transparent" }}
        >
          {/* Tags */}
          <div className="flex items-center gap-1 flex-wrap flex-1 min-w-0">
            {tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <motion.span
                  key={tag}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.15 }}
                  className="font-sans text-[0.75rem] px-2 py-0.5 rounded-full cursor-pointer hover:brightness-95 transition-all flex-shrink-0"
                  style={{ background: color.bg, color: color.text }}
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                >
                  {tag} ×
                </motion.span>
              );
            })}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={tags.length === 0 ? "tags..." : ""}
              aria-label="Add tags"
              className="font-sans text-[0.75rem] text-[#6B6B6B] placeholder-[#949494] bg-transparent min-w-[50px] flex-1"
            />
          </div>

          {/* Separator */}
          <div className="h-3 w-px bg-[rgba(0,0,0,0.06)] flex-shrink-0" />

          {/* Source icons */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {SOURCE_TYPES.map((s) => {
              const Icon = SOURCE_ICONS[s.id];
              const isActive = source === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSource(isActive ? undefined : s.id)}
                  className="p-2 rounded-md transition-all duration-150 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  style={{
                    background: isActive ? "rgba(201,160,160,0.15)" : "transparent",
                    color: isActive ? "#8B5E5E" : "#707070",
                  }}
                  title={s.label}
                >
                  <Icon size={13} />
                </button>
              );
            })}
          </div>

          {/* Season indicator */}
          {seasons.length > 0 && (
            <>
              <div className="h-3 w-px bg-[rgba(0,0,0,0.06)] flex-shrink-0" />
              <div className="relative flex-shrink-0" ref={seasonPickerRef}>
                <button
                  onClick={() => setShowSeasonPicker(!showSeasonPicker)}
                  className="font-sans text-[0.75rem] px-2 py-0.5 rounded-full transition-all duration-150 flex items-center gap-1"
                  style={{
                    background: activeSeason ? "rgba(201,160,160,0.12)" : "rgba(0,0,0,0.03)",
                    color: activeSeason ? "#C9A0A0" : "#737373",
                    border: activeSeason ? "1px solid rgba(201,160,160,0.2)" : "1px solid transparent",
                  }}
                  title={activeSeason ? `Season: ${activeSeason.name}` : "No season"}
                >
                  <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                    <circle cx="8" cy="8" r="6" />
                    <path d="M8 4v4l3 2" />
                  </svg>
                  <span>{activeSeason ? activeSeason.name : "No season"}</span>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 5l3 3 3-3" />
                  </svg>
                </button>

                {/* Season dropdown */}
                <AnimatePresence>
                  {showSeasonPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 mb-2 rounded-xl py-1.5 min-w-[130px] z-20"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        backdropFilter: "blur(16px)",
                        border: "1px solid rgba(0,0,0,0.06)",
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      }}
                    >
                      <button
                        onClick={() => {
                          onSeasonChange?.(undefined);
                          setShowSeasonPicker(false);
                        }}
                        className="w-full text-left font-sans text-[0.75rem] px-3 py-1.5 transition-colors hover:bg-[rgba(0,0,0,0.03)]"
                        style={{
                          color: !seasonId ? "#C9A0A0" : "#6B6B6B",
                          fontWeight: !seasonId ? 500 : 400,
                        }}
                      >
                        No season
                      </button>
                      {seasons.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => {
                            onSeasonChange?.(s.id);
                            setShowSeasonPicker(false);
                          }}
                          className="w-full text-left font-sans text-[0.75rem] px-3 py-1.5 transition-colors hover:bg-[rgba(0,0,0,0.03)]"
                          style={{
                            color: seasonId === s.id ? "#C9A0A0" : "#6B6B6B",
                            fontWeight: seasonId === s.id ? 500 : 400,
                          }}
                        >
                          {s.name}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Separator */}
          <div className="h-3 w-px bg-[rgba(0,0,0,0.06)] flex-shrink-0" />

          {/* Character count + shortcut */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {text.length > 200 && (
              <span
                className="font-sans text-[0.75rem] tracking-[0.02em] transition-colors duration-200"
                style={{ color: charCountColor }}
              >
                {text.length}/280
              </span>
            )}
            <span className="font-sans text-[0.75rem] text-[#707070] hidden sm:inline">
              ⌘ Enter
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
