import lessons from '@/data/lessons.json';
import { getAllProgress } from './db';

export type QuizQuestion = {
  q: string;
  choices: string[];
  answer: number;
  explain?: string;
};

export type Diagram = {
  caption?: string;
  svg?: string;
  png?: string;
  height?: number;
};

export type Lesson = {
  id: string;
  module: string;
  title: string;
  durationMin: number;
  /** Markdown. Use ![caption](diagram:N) to inline diagram index N. */
  content: string;
  /** Optional. If absent, `quiz` is used. */
  questionPool?: QuizQuestion[];
  /** Legacy / fallback fixed quiz. */
  quiz: QuizQuestion[];
  diagrams?: Diagram[];
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
  return ALL_LESSONS[Math.floor(Math.random() * ALL_LESSONS.length)];
}

export function passingScore(total: number) {
  return Math.ceil(total * 0.7);
}

/** Fisher-Yates shuffle (returns a new array). */
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns N random questions from the lesson's questionPool, or the full fixed
 * `quiz` if no pool exists. Each call yields a different selection.
 */
export function pickQuizQuestions(lesson: Lesson, n = 5): QuizQuestion[] {
  const pool = lesson.questionPool && lesson.questionPool.length > 0 ? lesson.questionPool : lesson.quiz;
  if (pool.length <= n) return shuffle(pool);
  return shuffle(pool).slice(0, n);
}

/**
 * Aggregate every available question across all lessons (using questionPool when present,
 * falling back to legacy quiz). Returns the global question bank size, useful for the UI.
 */
export function totalAvailableQuestions(): number {
  return ALL_LESSONS.reduce((acc, l) => {
    const pool = l.questionPool && l.questionPool.length > 0 ? l.questionPool : l.quiz;
    return acc + pool.length;
  }, 0);
}

/**
 * Pick N random questions across the ENTIRE corpus (all lessons combined).
 * Used for exam mode. Returns fewer if the corpus is smaller than N.
 */
export function pickExamQuestions(n = 30): QuizQuestion[] {
  const all: QuizQuestion[] = [];
  for (const l of ALL_LESSONS) {
    const pool = l.questionPool && l.questionPool.length > 0 ? l.questionPool : l.quiz;
    all.push(...pool);
  }
  if (all.length <= n) return shuffle(all);
  return shuffle(all).slice(0, n);
}
