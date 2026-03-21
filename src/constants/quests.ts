import type { Subject, Difficulty } from "@/types";

export const QUEST_SUBJECTS: Subject[] = [
  // Aligned with src/constants/game.ts
  "math",
  "japanese",
  "english",
  "science",
  "social", // Changed from social_studies to social for consistency
  "art",
  "music",
  "pe",
  "home_economics",
  "programming",
];

export const QUEST_DIFFICULTIES: Difficulty[] = [
  // Aligned with src/constants/game.ts
  "easy",
  "normal",
  "hard",
  "very_hard",
];

// Example quests - these would typically come from a database
export const EXAMPLE_QUESTS = [
  {
    id: "q1",
    title: "足し算マスターへの道",
    description: "1桁の足し算を10問解こう！",
    subject: "math" as Subject,
    difficulty: "easy" as Difficulty,
    expReward: 20,
    goldReward: 10,
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
  },
  {
    id: "q2",
    title: "ひらがな練習帳",
    description: "ひらがなを50音書いてみよう！",
    subject: "japanese" as Subject,
    difficulty: "easy" as Difficulty,
    expReward: 25,
    goldReward: 12,
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
  },
  {
    id: "q3",
    title: "英単語10個覚えよう",
    description: "基本的な英単語を10個、発音と一緒に覚えよう！",
    subject: "english" as Subject,
    difficulty: "normal" as Difficulty,
    expReward: 50,
    goldReward: 25,
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
  },
  {
    id: "q4",
    title: "日本の歴史クイズ",
    description: "日本の主要な歴史イベントに関するクイズに挑戦！",
    subject: "social" as Subject,
    difficulty: "hard" as Difficulty,
    expReward: 100,
    goldReward: 50,
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 10).toISOString(), // 10 days from now
  },
  {
    id: "q5",
    title: "プログラミング入門",
    description: "Scratchで簡単なアニメーションを作ってみよう！",
    subject: "programming" as Subject,
    difficulty: "very_hard" as Difficulty,
    expReward: 150,
    goldReward: 75,
    isCompleted: false,
    dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
  },
  {
    id: "q6",
    title: "かけ算九九マスター",
    description: "かけ算九九を完璧に覚えよう！",
    subject: "math" as Subject,
    difficulty: "normal" as Difficulty,
    expReward: 40,
    goldReward: 20,
    isCompleted: true, // Example of a completed quest
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
  },
];
