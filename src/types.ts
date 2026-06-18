export interface Option {
  label: string;
  text: string;
}

export interface Question {
  questionId: string;
  type: string;
  typeName: string;
  question: string;
  options: Option[];
  answer: string;
  verified?: boolean;
}

export interface BankInfo {
  id: string;
  name: string;
  fileName: string;
  count: number;
}

export type PracticeMode = 'sequential' | 'shuffle' | 'wrong';
