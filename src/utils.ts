import type { Question, PracticeMode, BankInfo } from './types';

export const BANK_LIST: BankInfo[] = [
  { id: 'judgment', name: '判断题', fileName: '判断题.json', count: 316 },
  { id: 'single', name: '单选题', fileName: '单选题.json', count: 362 },
];

export async function loadQuestions(fileName: string): Promise<Question[]> {
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}data/${fileName}`);
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
  wrongIds: Set<string>
): Question[] {
  if (mode === 'shuffle') return shuffle(questions);
  if (mode === 'wrong') return questions.filter((q) => wrongIds.has(q.questionId));
  return [...questions];
}

const WRONG_KEY = 'quiz_wrong_ids';

export function loadWrongIds(bankId: string): Set<string> {
  try {
    const raw = localStorage.getItem(WRONG_KEY);
    if (!raw) return new Set();
    const data = JSON.parse(raw);
    return new Set(data[bankId] || []);
  } catch {
    return new Set();
  }
}

export function saveWrongIds(bankId: string, ids: Set<string>) {
  try {
    const raw = localStorage.getItem(WRONG_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[bankId] = [...ids];
    localStorage.setItem(WRONG_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function addWrongId(bankId: string, questionId: string) {
  const ids = loadWrongIds(bankId);
  ids.add(questionId);
  saveWrongIds(bankId, ids);
}

export function removeWrongId(bankId: string, questionId: string) {
  const ids = loadWrongIds(bankId);
  ids.delete(questionId);
  saveWrongIds(bankId, ids);
}
