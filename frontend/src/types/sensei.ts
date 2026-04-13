export type SenseiConceptItem = {
  title: string;
  definition: string;
  key_points: string[];
  example: string;
};

export type SenseiPracticeQuestion = {
  question: string;
  answer: string;
};

export type SenseiContentResponse = {
  topic: string;
  concepts: SenseiConceptItem[];
  practice_questions: SenseiPracticeQuestion[];
};

export type SenseiChatMessage = {
  role: "user" | "assistant";
  content: string;
};
