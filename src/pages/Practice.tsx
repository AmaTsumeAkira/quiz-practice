import { useEffect, useCallback } from 'react';
import { Button, Typography, Result } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useQuiz } from '../context/QuizContext';
import { addWrongId, removeWrongId } from '../utils';
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

  const question = orderedQuestions[currentIndex];
  const total = orderedQuestions.length;

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  }, [currentIndex, setCurrentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
  }, [currentIndex, total, setCurrentIndex]);

  const handleAnswer = useCallback(
    (answer: string) => {
      if (!question || !bank) return;
      submitAnswer(question.questionId, answer);
      if (showResult) {
        if (answer === question.answer) {
          removeWrongId(bank.id, question.questionId);
        } else {
          addWrongId(bank.id, question.questionId);
        }
      }
    },
    [question, bank, submitAnswer, showResult]
  );

  const handleSubmitAll = useCallback(() => {
    if (!bank) return;
    orderedQuestions.forEach((q) => {
      const userAns = answers[q.questionId];
      if (!userAns) {
        addWrongId(bank.id, q.questionId);
      } else if (userAns === q.answer) {
        removeWrongId(bank.id, q.questionId);
      } else {
        addWrongId(bank.id, q.questionId);
      }
    });
    toggleResult();
  }, [bank, orderedQuestions, answers, toggleResult]);

  const handleBack = useCallback(() => {
    reset();
    navigate('/');
  }, [reset, navigate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
      else if (e.key >= 'A' && e.key <= 'D' && question) {
        handleAnswer(e.key);
      }
    },
    [handlePrev, handleNext, handleAnswer, question]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!question) return null;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="practice">
      <div className="practice-header">
        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
          返回
        </Button>
        <Title level={4} style={{ margin: 0 }}>
          {bank.name}
        </Title>
        <span className="progress-text">
          {currentIndex + 1} / {total}
        </span>
      </div>
      <div className="practice-body">
        <div className="practice-main">
          <QuestionCard
            question={question}
            index={currentIndex}
            userAnswer={answers[question.questionId] || ''}
            onAnswer={handleAnswer}
            showResult={showResult}
          />
          <div className="practice-nav">
            <Button
              icon={<ArrowLeftOutlined />}
              disabled={currentIndex === 0}
              onClick={handlePrev}
            >
              上一题
            </Button>
            {!showResult ? (
              <Button
                type="primary"
                onClick={handleSubmitAll}
                disabled={answeredCount === 0}
              >
                提交答案
              </Button>
            ) : (
              <Button
                icon={<ReloadOutlined />}
                onClick={handleSubmitAll}
              >
                重新查看
              </Button>
            )}
            <Button
              disabled={currentIndex === total - 1}
              onClick={handleNext}
            >
              下一题 <ArrowRightOutlined />
            </Button>
          </div>
          {showResult && (
            <div className="result-summary">
              已答 {answeredCount} / {total} 题
            </div>
          )}
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
