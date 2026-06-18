import { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Button, Typography, Result, Input } from 'antd';
import { ArrowLeftOutlined, SearchOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { addWrongId, removeWrongId, toggleBookmark, loadBookmarkIds } from '../utils';
import QuestionCard from '../components/QuestionCard';
import AnswerSheet from '../components/AnswerSheet';

const { Title } = Typography;

export default function Practice() {
  const navigate = useNavigate();
  const {
    bank,
    orderedQuestions,
    currentIndex,
    answers,
    showResult,
    setCurrentIndex,
    submitAnswer,
    toggleResult,
    reset,
  } = useQuiz();

  const [bookmarks, setBookmarks] = useState<Set<string>>(() =>
    bank ? loadBookmarkIds(bank.id) : new Set()
  );
  const [searchText, setSearchText] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const touchStartX = useRef(0);

  const question = orderedQuestions[currentIndex];
  const total = orderedQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === total;

  const stats = useMemo(() => {
    let correct = 0;
    let wrong = 0;
    for (const q of orderedQuestions) {
      const ans = answers[q.questionId];
      if (ans) {
        if (ans === q.answer) correct++;
        else wrong++;
      }
    }
    return { correct, wrong, unanswered: total - correct - wrong };
  }, [orderedQuestions, answers, total]);

  // Auto-advance on correct answer
  const handleAnswer = useCallback(
    (answer: string) => {
      if (!question || !bank) return;
      submitAnswer(question.questionId, answer);
      if (answer === question.answer) {
        removeWrongId(bank.id, question.questionId);
        // Auto-advance to next question after correct answer
        setTimeout(() => {
          if (currentIndex < total - 1) {
            setCurrentIndex(currentIndex + 1);
          } else {
            setShowComplete(true);
          }
        }, 600);
      } else {
        addWrongId(bank.id, question.questionId);
      }
    },
    [question, bank, submitAnswer, currentIndex, total, setCurrentIndex]
  );

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, total, setCurrentIndex]);

  const handleBack = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

  const handleSubmitAll = useCallback(() => {
    if (!bank) return;
    // Only process answered questions - don't mark unanswered as wrong
    orderedQuestions.forEach((q) => {
      const userAns = answers[q.questionId];
      if (userAns) {
        if (userAns === q.answer) {
          removeWrongId(bank.id, q.questionId);
        } else {
          addWrongId(bank.id, q.questionId);
        }
      }
    });
    toggleResult();
  }, [bank, orderedQuestions, answers, toggleResult]);

  const handleToggleBookmark = useCallback(() => {
    if (!question || !bank) return;
    const isNowBookmarked = toggleBookmark(bank.id, question.questionId);
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (isNowBookmarked) next.add(question.questionId);
      else next.delete(question.questionId);
      return next;
    });
  }, [question, bank]);

  // Touch swipe for mobile
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0 && currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (dx > 0 && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      }
    }
  }, [currentIndex, total, setCurrentIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handlePrev, handleNext]);

  if (!bank || orderedQuestions.length === 0) {
    return (
      <Result
        status="warning"
        title="没有选择题库"
        subTitle="请先返回首页选择题库"
        extra={<Button type="primary" onClick={() => navigate('/')}>返回首页</Button>}
      />
    );
  }

  // Completion screen
  if (showComplete || (showResult && allAnswered)) {
    return (
      <div className="practice">
        <div className="practice-header">
          <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>
            返回
          </Button>
          <Title level={5} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
            {bank.name}
          </Title>
        </div>
        <Result
          icon={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
          title="练习完成"
          subTitle={`${total} 道题全部答完`}
          extra={[
            <Button key="stats" onClick={() => { setShowComplete(false); toggleResult(); }}>
              查看统计
            </Button>,
            <Button key="back" type="primary" onClick={handleBack}>
              返回首页
            </Button>,
          ]}
        >
          <div style={{ textAlign: 'center' }}>
            <p>正确: {stats.correct} | 错误: {stats.wrong} | 正确率: {total > 0 ? Math.round((stats.correct / total) * 100) : 0}%</p>
          </div>
        </Result>
      </div>
    );
  }

  if (!question) return null;

  // Filter by search
  const displayIndex = searchText.trim()
    ? orderedQuestions.findIndex((q) => q.questionId === question.questionId)
    : currentIndex;

  return (
    <div className="practice">
      <div className="practice-header">
        <Button size="small" icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回
        </Button>
        <Title level={5} style={{ margin: 0, flex: 1, textAlign: 'center' }}>
          {bank.name}
        </Title>
        <Button
          size="small"
          icon={<SearchOutlined />}
          onClick={() => setShowSearch(!showSearch)}
          type={showSearch ? 'primary' : 'default'}
        />
        <span className="progress-text">
          {currentIndex + 1}/{total}
        </span>
      </div>

      {showSearch && (
        <Input
          placeholder="搜索题目关键词..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />
      )}

      {showResult && (
        <div className="stats-bar">
          <span className="stat-item">已答 {answeredCount}/{total}</span>
          <span className="stat-item stat-correct">正确 {stats.correct}</span>
          <span className="stat-item stat-wrong">错误 {stats.wrong}</span>
          <span className="stat-item">正确率 {answeredCount > 0 ? Math.round((stats.correct / answeredCount) * 100) : 0}%</span>
        </div>
      )}

      <div
        className="practice-body"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="practice-main">
          <QuestionCard
            question={question}
            index={displayIndex}
            userAnswer={answers[question.questionId] || ''}
            onAnswer={handleAnswer}
            isBookmarked={bookmarks.has(question.questionId)}
            onToggleBookmark={handleToggleBookmark}
          />
          <div className="practice-nav">
            <Button size="small" disabled={currentIndex === 0} onClick={handlePrev}>
              上一题
            </Button>
            {!showResult ? (
              <Button size="small" type="primary" onClick={handleSubmitAll} disabled={answeredCount === 0}>
                提交全部
              </Button>
            ) : (
              <Button size="small" onClick={handleSubmitAll}>
                重新查看
              </Button>
            )}
            <Button size="small" disabled={currentIndex === total - 1} onClick={handleNext}>
              下一题
            </Button>
          </div>
        </div>

        <div className="practice-sidebar">
          <AnswerSheet
            questions={orderedQuestions}
            answers={answers}
            currentIndex={currentIndex}
            onSelect={setCurrentIndex}
            showResult={showResult}
          />
        </div>
      </div>
    </div>
  );
}
