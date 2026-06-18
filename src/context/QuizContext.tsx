import { createContext, useContext, useState, useCallback } from 'react';
import type { Question, PracticeMode, BankInfo } from '../types';

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

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QuizState>({
    bank: null,
    questions: [],
    orderedQuestions: [],
    currentIndex: 0,
    mode: 'sequential',
    answers: {},
    showResult: false,
  });

  const setBank = useCallback(
    (bank: BankInfo, questions: Question[], ordered: Question[], mode: PracticeMode) => {
      setState({
        bank,
        questions,
        orderedQuestions: ordered,
        currentIndex: 0,
        mode,
        answers: {},
        showResult: false,
      });
    },
    []
  );

  const setCurrentIndex = useCallback((i: number) => {
    setState((s) => ({ ...s, currentIndex: i }));
  }, []);

  const submitAnswer = useCallback((questionId: string, answer: string) => {
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [questionId]: answer },
    }));
  }, []);

  const toggleResult = useCallback(() => {
    setState((s) => ({ ...s, showResult: !s.showResult }));
  }, []);

  const reset = useCallback(() => {
    setState({
      bank: null,
      questions: [],
      orderedQuestions: [],
      currentIndex: 0,
      mode: 'sequential',
      answers: {},
      showResult: false,
    });
  }, []);

  return (
    <QuizContext.Provider
      value={{ ...state, setBank, setCurrentIndex, submitAnswer, toggleResult, reset }}
    >
      {children}
    </QuizContext.Provider>
  );
}
