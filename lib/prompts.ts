// Writing prompt generator for the capture bar

const GENERIC_PROMPTS = [
  "What\u2019s on your mind right now?",
  "What did you notice today?",
  "What would you tell your past self?",
  "What question keeps returning to you?",
  "What felt different about today?",
  "What are you learning to let go of?",
  "What\u2019s something small that mattered?",
  "What connection did you make recently?",
  "What are you curious about right now?",
  "What would you like to remember?",
];

const TAG_TEMPLATES = [
  "You\u2019ve been thinking about {tag} lately. What\u2019s shifted?",
  "Your mind keeps returning to {tag}. What\u2019s pulling you there?",
  "What\u2019s the newest thing you\u2019ve noticed about {tag}?",
  "{tag} has been on your mind. Where is it leading you?",
  "If {tag} were a question, what would it ask?",
];

export function getWritingPrompt(recentTags: string[]): string {
  // 30% chance of tag-aware prompt if tags exist
  if (recentTags.length > 0 && Math.random() < 0.3) {
    const tag = recentTags[Math.floor(Math.random() * Math.min(recentTags.length, 5))];
    const template = TAG_TEMPLATES[Math.floor(Math.random() * TAG_TEMPLATES.length)];
    return template.replace("{tag}", tag);
  }
  return GENERIC_PROMPTS[Math.floor(Math.random() * GENERIC_PROMPTS.length)];
}
