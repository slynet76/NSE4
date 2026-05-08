export type RootStackParamList = {
  Home: undefined;
  Lesson: { id: string };
  Quiz: { id: string };
  Exam: { count?: number };
  Progress: undefined;
  Settings: undefined;
};
