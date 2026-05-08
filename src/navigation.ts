export type RootStackParamList = {
  Home: undefined;
  Lesson: { id: string };
  Quiz: { id: string };
  Exam: { count?: number; durationMin?: number };
  ExamHistory: undefined;
  Progress: undefined;
  Settings: undefined;
};
