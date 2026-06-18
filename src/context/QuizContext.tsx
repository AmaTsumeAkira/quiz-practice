import { createContext, useContext, useState, useCallback } from 'react';
import type { Question, PracticeMode, BankInfo } from '../types';

const PROGRESS_KEY = 'quiz_progress';

interface QuizState {
  bank: BankInfo | null;
  questions: Question[];
  orderedQuestions: Question[];
  currentIndex: number;
  mode: PracticeMode;
  answers: Record<string, string>;
  showResult: boolean;
}

interface QuizContextType extends QuizState {
  setBank: (bank: BankInfo, questions: Question[], ordered: Question[], mode: PracticeMode) => void;
  setCurrentIndex: (i: number) => void;
  submitAnswer: (questionId: string, answer: string) => void;
  toggleResult: () => void;
  reset: () => void;
}

const QuizContext = createContext<QuizContextType | null>(null);

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error('useQuiz must be used within QuizProvider');
  return ctx;
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(state: QuizState) {
  try {
    if (!state.bank) {
      localStorage.removeItem(PROGRESS_KEY);
      return;
    }
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      bank: state.bank,
      answers: state.answers,
      showResult: state.showResult,
      mode: state.mode,
      orderedQuestionIds: state.orderedQuestions.map((q) => q.questionId),
    }));
  } catch {
    // ignore
  }
}

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuizState>(() => {
    const saved = loadProgress();
    // Try to restore - we need to load questions first, but can't in useState
    // So we just restore metadata and re-load on mount if needed
    if (saved.bank) {
      return {
        bank: saved.bank,
        questions: [],
        orderedQuestions: [],
        currentIndex: 0,
        mode: saved.mode || 'sequential',
        answers: saved.answers || {},
        showResult: saved.showResult || false,
      };
    }
    return {
      bank: null,
      questions: [],
      orderedQuestions: [],
      currentIndex: 0,
      mode: 'sequential',
      answers: {},
      showResult: false,
    };
  });

  const setBank = useCallback(
    (bank: BankInfo, questions: Question[], ordered: Question[], mode: PracticeMode) => {
      const newState: QuizState = {
        bank,
        questions,
        orderedQuestions: ordered,
        currentIndex: 0,
        mode,
        answers: {},
        showResult: false,
      };
      setState(newState);
      saveProgress(newState);
    },
    []
  );

  const setCurrentIndex = useCallback((i: number) => {
    setState((s) => {
      const next = { ...s, currentIndex: i };
      return next;
    });
  }, []);

  const submitAnswer = useCallback((questionId: string, answer: string) => {
    setState((s) => {
      const next = {
        ...s,
        answers: { ...s.answers, [questionId]: answer },
      };
      saveProgress(next);
      return next;
    });
  }, []);

  const toggleResult = useCallback(() => {
    setState((s) => {
      const next = { ...s, showResult: !s.showResult };
      saveProgress(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    const next: QuizState = {
      bank: null,
      questions: [],
      orderedQuestions: [],
      currentIndex: 0,
      mode: 'sequential',
      answers: {},
      showResult: false,
    };
    setState(next);
    localStorage.removeItem(PROGRESS_KEY);
  }, []);

  return (
    <QuizContext.Provider
      value={{ ...state, setBank, setCurrentIndex, submitAnswer, toggleResult, reset }}
    >
      {children}
    </QuizContext.Provider>
  );
}
