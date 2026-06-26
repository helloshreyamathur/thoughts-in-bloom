"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ThoughtCard from "@/components/ThoughtCard";
import MasonryGrid from "@/components/MasonryGrid";
import { getThoughts, restoreThought, deleteThought, type Thought } from "@/lib/storage";

export default function ArchivePage() {
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setThoughts(getThoughts().filter((t) => t.archived));
  }, []);

  const handleRestore = (id: string) => {
    restoreThought(id);
    setThoughts(thoughts.filter((t) => t.id !== id));
  };

  const handleDelete = (id: string) => {
    deleteThought(id);
    setThoughts(thoughts.filter((t) => t.id !== id));
    setConfirmDelete(null);
  };

  const handleRestoreAll = () => {
    thoughts.forEach((t) => restoreThought(t.id));
    setThoughts([]);
  };

  return (
    <motion.main
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="min-h-screen pt-28 pb-24 px-6"
    >
      <div className="max-w-[680px] mx-auto mb-12">
        <h1 className="font-serif italic text-[3rem] text-[#1C1C1E] leading-[1.15] tracking-[-0.02em] mb-3">
          Archive
        </h1>
        {thoughts.length > 0 && (
          <p className="font-sans text-[0.8rem] text-[#6B6B6B] font-light">
            {thoughts.length} archived thought{thoughts.length !== 1 ? "s" : ""}
          </p>
        )}
        {thoughts.length > 0 && (
          <button
            onClick={handleRestoreAll}
            className="font-sans text-[0.75rem] text-[#537A5E] hover:text-[#3D6B4E] transition-colors mt-2"
          >
            Restore all &rarr;
          </button>
        )}
      </div>

      <div className="max-w-[1100px] mx-auto">
        {thoughts.length === 0 ? (
          <div className="text-center py-20 relative">
            <div
              className="mx-auto w-[140px] h-[140px] mb-6"
              style={{
                background: "radial-gradient(circle, rgba(143,175,154,0.1) 0%, transparent 70%)",
                filter: "blur(25px)",
              }}
            />
            <p className="font-serif italic text-[1.15rem] text-[#707070] mb-2">
              Nothing archived yet.
            </p>
            <p className="font-sans text-[0.75rem] text-[#707070]">
              Your active thoughts live in the garden.
            </p>
          </div>
        ) : (
          <MasonryGrid>
            {thoughts.map((thought, i) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                index={i}
                isArchived={true}
                onRestore={handleRestore}
              />
            ))}
          </MasonryGrid>
        )}
      </div>
    </motion.main>
  );
}
