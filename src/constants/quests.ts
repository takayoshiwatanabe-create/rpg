import type { Subject, Difficulty } from "@/types";

export const QUEST_SUBJECTS: Subject[] = [
  "math",
  "japanese",
  "english",
  "science",
  "social", // Changed from social_studies to social to match the type and monster constant
  "art",
  "music",
  "pe",
  "other",
];

export const QUEST_DIFFICULTIES: Difficulty[] = [
  "easy",
  "normal",
  "hard",
  "very_hard",
  "boss",
];
