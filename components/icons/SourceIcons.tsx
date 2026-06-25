// Abstract minimal SVG source icons — botanical aesthetic, thin strokes

interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

// Open pages — book
export function BookIcon({ size = 14, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M3 4c0-1 1.5-2 4-2s4 1.5 4 2.5v12c0-.8-1.5-1.5-4-1.5s-4 .7-4 1.5V4z" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M11 4.5c0-1 1.5-2 4-2s4 1 4 2v12c0-.8-1.5-1.5-4-1.5s-4 .7-4 1.5V4.5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// Speech ripple — conversation
export function ConversationIcon({ size = 14, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M4 12c-1-1-2-2.5-2-4.5C2 4 5.5 1.5 10 1.5S18 4 18 7.5c0 3.5-3.5 6-8 6-.8 0-1.5-.1-2.2-.2L4 15.5V12z" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7" cy="7.5" r="0.8" fill={color} opacity="0.5" />
      <circle cx="10" cy="7.5" r="0.8" fill={color} opacity="0.5" />
      <circle cx="13" cy="7.5" r="0.8" fill={color} opacity="0.5" />
    </svg>
  );
}

// Eye/lens — observation
export function ObservationIcon({ size = 14, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10" cy="10" r="2.5" stroke={color} strokeWidth="1.2" />
      <circle cx="10" cy="10" r="0.8" fill={color} opacity="0.4" />
    </svg>
  );
}

// Crescent — dream
export function DreamIcon({ size = 14, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M15 3.5A7 7 0 1 0 15 16.5 5.5 5.5 0 0 1 15 3.5z" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="14" cy="5" r="0.6" fill={color} opacity="0.3" />
      <circle cx="16.5" cy="7.5" r="0.4" fill={color} opacity="0.25" />
    </svg>
  );
}

// Spiral — question
export function QuestionIcon({ size = 14, color = "currentColor", className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" className={className}>
      <path d="M7 7.5C7 5 8.5 3.5 10.5 3.5S14 5 14 7c0 1.5-1 2.5-2.5 3-.5.2-1 .5-1 1.2v1" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="10.5" cy="15" r="0.8" fill={color} opacity="0.5" />
    </svg>
  );
}

// Dispatcher component
export function SourceIcon({ source, ...props }: IconProps & { source: string }) {
  switch (source) {
    case "book": return <BookIcon {...props} />;
    case "conversation": return <ConversationIcon {...props} />;
    case "observation": return <ObservationIcon {...props} />;
    case "dream": return <DreamIcon {...props} />;
    case "question": return <QuestionIcon {...props} />;
    default: return null;
  }
}
