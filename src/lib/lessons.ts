import lessons from '@/data/lessons.json';
import { getAllProgress } from './db';

export type QuizQuestion = {
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type Lesson = {
  id: string;
  module: string;
  title: string;
  durationMin: number;
  content: string;
  quiz: QuizQuestion[];
};

export const ALL_LESSONS: Lesson[] = lessons as Lesson[];

export function lessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function pickTodayLesson(): Lesson {
  const progress = new Map(getAllProgress().map((p) => [p.lessonId, p]));
  const failed = ALL_LESSONS.find((l) => progress.get(l.id)?.status === 'failed');
  if (failed) return failed;
  const next = ALL_LESSONS.find((l) => !progress.has(l.id));
  if (next) return next;
  // All done — random review
  return ALL_LESSONS[Math.floor(Math.random() * ALL_LESSONS.length)];
}

export function passingScore(total: number) {
  return Math.ceil(total * 0.7);
}
