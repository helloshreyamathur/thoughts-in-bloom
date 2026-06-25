// Shared tag color utilities — single source of truth

export const TAG_COLORS = [
  { bg: "rgba(201, 160, 160, 0.18)", text: "#C9A0A0" },
  { bg: "rgba(143, 175, 154, 0.18)", text: "#8FAF9A" },
  { bg: "rgba(160, 154, 201, 0.18)", text: "#A09AC9" },
];

export function getTagColor(tag: string) {
  const sum = tag.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return TAG_COLORS[sum % TAG_COLORS.length];
}

// Source types for thought origin attribution
export const SOURCE_TYPES = [
  { id: "observation", label: "Observation" },
  { id: "conversation", label: "Conversation" },
  { id: "book", label: "Book" },
  { id: "dream", label: "Dream" },
  { id: "question", label: "Question" },
] as const;

export type SourceType = (typeof SOURCE_TYPES)[number]["id"];
