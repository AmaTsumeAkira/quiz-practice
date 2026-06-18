import type { Question } from '../types';

interface Props {
  questions: Question[];
  answers: Record<string, string>;
  currentIndex: number;
  onSelect: (index: number) => void;
  showResult: boolean;
}

export default function AnswerSheet({ questions, answers, currentIndex, onSelect, showResult }: Props) {
  return (
    <div className="answer-sheet">
      <div className="sheet-title">答题卡</div>
      <div className="sheet-grid">
        {questions.map((q, i) => {
          const userAns = answers[q.questionId];
          const isAnswered = !!userAns;
          const isActive = i === currentIndex;
          let statusClass = '';
          if (showResult && isAnswered) {
            statusClass = userAns === q.answer ? 'correct' : 'wrong';
          } else if (isAnswered) {
            statusClass = 'answered';
          }
          return (
            <button
              key={q.questionId}
              className={`sheet-cell ${statusClass} ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(i)}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="sheet-legend">
        {showResult ? (
          <>
            <span className="legend-item"><span className="dot correct" /> 正确</span>
            <span className="legend-item"><span className="dot wrong" /> 错误</span>
            <span className="legend-item"><span className="dot unanswered" /> 未答</span>
          </>
        ) : (
          <>
            <span className="legend-item"><span className="dot answered" /> 已答</span>
            <span className="legend-item"><span className="dot unanswered" /> 未答</span>
          </>
        )}
      </div>
    </div>
  );
}
