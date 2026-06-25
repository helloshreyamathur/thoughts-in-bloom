"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

interface MasonryGridProps {
  children: ReactNode[];
  columns?: number;
  gap?: number;
}

export default function MasonryGrid({ children, columns: defaultCols = 3, gap = 24 }: MasonryGridProps) {
  const [columns, setColumns] = useState(defaultCols);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width < 640) setColumns(1);
      else if (width < 1024) setColumns(2);
      else setColumns(defaultCols);
    };
    updateColumns();
    window.addEventListener("resize", updateColumns);
    return () => window.removeEventListener("resize", updateColumns);
  }, [defaultCols]);

  // Distribute children into columns round-robin (simple approach for SSR compat)
  const columnArrays: ReactNode[][] = Array.from({ length: columns }, () => []);
  children.forEach((child, i) => {
    columnArrays[i % columns].push(child);
  });

  return (
    <div
      ref={containerRef}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `${gap}px`,
        alignItems: "start",
      }}
    >
      {columnArrays.map((col, colIndex) => (
        <div key={colIndex} style={{ display: "flex", flexDirection: "column", gap: `${gap}px` }}>
          {col}
        </div>
      ))}
    </div>
  );
}
