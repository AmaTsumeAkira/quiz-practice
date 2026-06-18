import type { Question, PracticeMode, BankInfo } from './types';

export const BANK_LIST: BankInfo[] = [
  { id: 'judgment', name: '近代史-判断', fileName: '判断题.json', count: 316 },
  { id: 'single', name: '近代史-单选', fileName: '单选题.json', count: 362 },
];

export async function loadQuestions(fileName: string): Promise<Question[]> {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}data/${fileName}`);
  if (!res.ok) throw new Error(`Failed to load ${fileName}: ${res.status}`);
  return res.json();
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getOrderedQuestions(
  questions: Question[],
  mode: PracticeMode,
  wrongIds: Set<string>,
  bookmarkIds: Set<string>
): Question[] {
  if (mode === 'shuffle') return shuffle(questions);
  if (mode === 'wrong') return questions.filter((q) => wrongIds.has(q.questionId));
  if (mode === 'bookmark') return questions.filter((q) => bookmarkIds.has(q.questionId));
  return [...questions];
}

const WRONG_KEY = 'quiz_wrong_ids';
const BOOKMARK_KEY = 'quiz_bookmark_ids';

function loadSet(key: string, bankId: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    return new Set(data[bankId] || []);
  } catch {
    return new Set();
  }
}

function saveSet(key: string, bankId: string, ids: Set<string>) {
  try {
    const raw = localStorage.getItem(key);
    const data = raw ? JSON.parse(raw) : {};
    data[bankId] = [...ids];
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

function toggleId(key: string, bankId: string, questionId: string, add: boolean) {
  const ids = loadSet(key, bankId);
  if (add) ids.add(questionId);
  else ids.delete(questionId);
  saveSet(key, bankId, ids);
}

// Wrong IDs
export function loadWrongIds(bankId: string): Set<string> {
  return loadSet(WRONG_KEY, bankId);
}

export function addWrongId(bankId: string, questionId: string) {
  toggleId(WRONG_KEY, bankId, questionId, true);
}

export function removeWrongId(bankId: string, questionId: string) {
  toggleId(WRONG_KEY, bankId, questionId, false);
}

// Bookmark IDs
export function loadBookmarkIds(bankId: string): Set<string> {
  return loadSet(BOOKMARK_KEY, bankId);
}

export function toggleBookmark(bankId: string, questionId: string): boolean {
  const ids = loadSet(BOOKMARK_KEY, bankId);
  if (ids.has(questionId)) {
    ids.delete(questionId);
  } else {
    ids.add(questionId);
  }
  saveSet(BOOKMARK_KEY, bankId, ids);
  return ids.has(questionId);
}
