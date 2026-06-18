import { Radio, Space } from 'antd';
import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
  userAnswer: string;
  onAnswer: (answer: string) => void;
  showResult: boolean;
}

export default function QuestionCard({ question, index, userAnswer, onAnswer, showResult }: Props) {
  const isCorrect = userAnswer === question.answer;

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-index">{index + 1}.</span>
        <span className="question-type">{question.typeName}</span>
      </div>
      <div className="question-text">{question.question}</div>
      <Radio.Group
        className="question-options"
        onChange={(e) => onAnswer(e.target.value)}
        value={userAnswer || undefined}
        disabled={showResult}
      >
        <Space direction="vertical" size={12}>
          {question.options.map((opt) => (
            <Radio key={opt.label} value={opt.label} className="option-item">
              <span className="option-label">{opt.label}.</span>
              <span className="option-text">{opt.text}</span>
              {showResult && opt.label === question.answer && (
                <span className="correct-mark">正确</span>
              )}
              {showResult && opt.label === userAnswer && !isCorrect && (
                <span className="wrong-mark">你的答案</span>
              )}
            </Radio>
          ))}
        </Space>
      </Radio.Group>
      {showResult && (
        <div className={`result-line ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? '回答正确' : `正确答案: ${question.answer}`}
        </div>
      )}
    </div>
  );
}
