import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('nse4.db');

export type LessonProgress = {
  lessonId: string;
  status: 'locked' | 'available' | 'done' | 'failed';
  score: number | null;
  completedAt: number | null;
};

export type ExamAttempt = {
  id: number;
  ts: number;
  score: number;
  total: number;
  durationSec: number | null;
};

export function initDb() {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS progress (
      lessonId TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'available',
      score INTEGER,
      completedAt INTEGER
    );
    CREATE TABLE IF NOT EXISTS streak (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current INTEGER NOT NULL DEFAULT 0,
      best INTEGER NOT NULL DEFAULT 0,
      lastDay TEXT
    );
    INSERT OR IGNORE INTO streak (id, current, best) VALUES (1, 0, 0);
    CREATE TABLE IF NOT EXISTS exam_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total INTEGER NOT NULL,
      durationSec INTEGER
    );
  `);
}

export function getProgress(lessonId: string): LessonProgress | null {
  const row = db.getFirstSync<LessonProgress>(
    'SELECT lessonId, status, score, completedAt FROM progress WHERE lessonId = ?',
    [lessonId],
  );
  return row ?? null;
}

export function getAllProgress(): LessonProgress[] {
  return db.getAllSync<LessonProgress>(
    'SELECT lessonId, status, score, completedAt FROM progress',
  );
}

export function setLessonResult(lessonId: string, score: number, passed: boolean) {
  db.runSync(
    `INSERT INTO progress (lessonId, status, score, completedAt)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(lessonId) DO UPDATE SET
       status = excluded.status,
       score = excluded.score,
       completedAt = excluded.completedAt`,
    [lessonId, passed ? 'done' : 'failed', score, Date.now()],
  );
  if (passed) bumpStreak();
}

function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

export function getStreak() {
  const row = db.getFirstSync<{ current: number; best: number; lastDay: string | null }>(
    'SELECT current, best, lastDay FROM streak WHERE id = 1',
  );
  return row ?? { current: 0, best: 0, lastDay: null };
}

function bumpStreak() {
  const s = getStreak();
  const today = todayKey();
  if (s.lastDay === today) return;
  const yest = todayKey(new Date(Date.now() - 86400000));
  const next = s.lastDay === yest ? s.current + 1 : 1;
  const best = Math.max(s.best, next);
  db.runSync(
    'UPDATE streak SET current = ?, best = ?, lastDay = ? WHERE id = 1',
    [next, best, today],
  );
}

export function recordExamAttempt(score: number, total: number, durationSec: number | null = null) {
  db.runSync(
    'INSERT INTO exam_history (ts, score, total, durationSec) VALUES (?, ?, ?, ?)',
    [Date.now(), score, total, durationSec],
  );
}

export function getExamHistory(limit = 50): ExamAttempt[] {
  return db.getAllSync<ExamAttempt>(
    'SELECT id, ts, score, total, durationSec FROM exam_history ORDER BY ts DESC LIMIT ?',
    [limit],
  );
}
