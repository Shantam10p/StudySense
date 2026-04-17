export type SenseiConceptItem = {
  title: string;
  definition: string;
  key_points: string[];
  example: string;
  code_example?: string;
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

export type ChatHistoryMessage = {
  id: number;
  role: "user" | "assistant";
  content: string;
};

export type ChatHistoryResponse = {
  task_id: number;
  messages: ChatHistoryMessage[];
};
