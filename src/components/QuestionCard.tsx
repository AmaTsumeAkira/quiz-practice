import type { Question } from '../types';

interface Props {
  question: Question;
  index: number;
  userAnswer: string;
  onAnswer: (answer: string) => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export default function QuestionCard({
  question,
  index,
  userAnswer,
  onAnswer,
  isBookmarked,
  onToggleBookmark,
}: Props) {
  const answered = !!userAnswer;
  const isCorrect = answered && userAnswer === question.answer;

  return (
    <div className="question-card">
      <div className="question-header">
        <span className="question-index">{index + 1}.</span>
        <span className="question-type">{question.typeName}</span>
        {answered && (
          <span className={`answer-badge ${isCorrect ? 'badge-correct' : 'badge-wrong'}`}>
            {isCorrect ? '正确' : '错误'}
          </span>
        )}
        <button
          className={`bookmark-btn ${isBookmarked ? 'active' : ''}`}
          onClick={onToggleBookmark}
          title={isBookmarked ? '取消收藏' : '收藏'}
        >
          {isBookmarked ? '★' : '☆'}
        </button>
      </div>
      <div className="question-text">{question.question}</div>
      <div className="question-options">
        {question.options.map((opt) => {
          let cls = 'option-item';
          const isSelected = opt.label === userAnswer;
          if (answered) {
            if (opt.label === question.answer) cls += ' opt-correct';
            else if (isSelected) cls += ' opt-wrong';
          }
          return (
            <div
              key={opt.label}
              className={cls}
              onClick={() => onAnswer(opt.label)}
            >
              <span className="option-label">{opt.label}</span>
              <span className="option-text">{opt.text}</span>
              {answered && opt.label === question.answer && (
                <span className="opt-tag correct">正确</span>
              )}
              {answered && isSelected && !isCorrect && (
                <span className="opt-tag wrong">你的答案</span>
              )}
            </div>
          );
        })}
      </div>
      {answered && (
        <div className={`result-line ${isCorrect ? 'correct' : 'wrong'}`}>
          {isCorrect ? '回答正确' : `正确答案: ${question.answer}`}
        </div>
      )}
    </div>
  );
}
