import { useState, useMemo } from 'react';
import { Card, Radio, Button, Typography, Input, Statistic, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BANK_LIST, loadQuestions, getOrderedQuestions, loadWrongIds, loadBookmarkIds } from '../utils';
import type { PracticeMode, BankInfo } from '../types';
import { useQuiz } from '../context/QuizContext';

const { Title, Text } = Typography;
const PROGRESS_KEY = 'quiz_progress';

function hasSavedProgress(): boolean {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    return !!data.bank && !!data.orderedQuestionIds && data.orderedQuestionIds.length > 0;
  } catch {
    return false;
  }
}

function getSavedProgressInfo(): { bankName: string; answered: number; total: number } | null {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data.bank || !data.orderedQuestionIds) return null;
    return {
      bankName: data.bank.name,
      answered: Object.keys(data.answers || {}).length,
      total: data.orderedQuestionIds.length,
    };
  } catch {
    return null;
  }
}

export default function Home() {
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [mode, setMode] = useState<PracticeMode>('sequential');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const { setBank, answers } = useQuiz();

  const savedProgress = useMemo(() => getSavedProgressInfo(), []);
  const canRestore = hasSavedProgress();

  const stats = useMemo(() => {
    if (!selectedBank) return null;
    const wrongIds = loadWrongIds(selectedBank.id);
    const bookmarkIds = loadBookmarkIds(selectedBank.id);
    return {
      total: selectedBank.count,
      wrong: wrongIds.size,
      bookmark: bookmarkIds.size,
    };
  }, [selectedBank, answers]);

  const handleStart = async () => {
    if (!selectedBank) return;
    setLoading(true);
    try {
      const questions = await loadQuestions(selectedBank.fileName);
      const wrongIds = loadWrongIds(selectedBank.id);
      const bookmarkIds = loadBookmarkIds(selectedBank.id);
      let ordered = getOrderedQuestions(questions, mode, wrongIds, bookmarkIds);
      if (search.trim()) {
        const kw = search.trim().toLowerCase();
        ordered = ordered.filter(
          (q) =>
            q.question.toLowerCase().includes(kw) ||
            q.options.some((o) => o.text.toLowerCase().includes(kw))
        );
      }
      if (ordered.length === 0) {
        alert('没有匹配的题目');
        setLoading(false);
        return;
      }
      setBank(selectedBank, questions, ordered, mode);
      navigate('/practice');
    } catch {
      alert('加载题库失败');
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) || '{}');
      if (!saved.bank || !saved.orderedQuestionIds) {
        alert('没有找到保存的进度');
        setLoading(false);
        return;
      }
      const questions = await loadQuestions(saved.bank.fileName);
      const qMap = new Map(questions.map((q) => [q.questionId, q]));
      const ordered = saved.orderedQuestionIds
        .map((id: string) => qMap.get(id))
        .filter(Boolean);
      if (ordered.length === 0) {
        alert('保存的进度已失效');
        setLoading(false);
        return;
      }
      setBank(saved.bank, questions, ordered, saved.mode || 'sequential');
      // Restore answers
      navigate('/practice');
    } catch {
      alert('恢复进度失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home">
      <div className="home-content">
        <Title level={3} style={{ marginBottom: 24 }}>题库练习</Title>

        {canRestore && savedProgress && (
          <Card size="small" className="home-card" style={{ marginBottom: 16, borderColor: '#d9d9d9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text strong>{savedProgress.bankName}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                  已答 {savedProgress.answered}/{savedProgress.total} 题
                </Text>
              </div>
              <Button type="primary" size="small" loading={loading} onClick={handleContinue}>
                继续练习
              </Button>
            </div>
          </Card>
        )}

        <Card title="选择题库" className="home-card">
          <Radio.Group
            value={selectedBank?.id}
            onChange={(e) => setSelectedBank(BANK_LIST.find((b) => b.id === e.target.value) || null)}
            optionType="button"
            buttonStyle="solid"
          >
            {BANK_LIST.map((bank) => (
              <Radio.Button key={bank.id} value={bank.id}>
                {bank.name} ({bank.count}题)
              </Radio.Button>
            ))}
          </Radio.Group>
        </Card>

        <Card title="练习模式" className="home-card">
          <Radio.Group
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            optionType="button"
            buttonStyle="solid"
          >
            <Radio.Button value="sequential">顺序练习</Radio.Button>
            <Radio.Button value="shuffle">乱序练习</Radio.Button>
            <Radio.Button value="wrong">错题重练</Radio.Button>
            <Radio.Button value="bookmark">收藏练习</Radio.Button>
          </Radio.Group>
        </Card>

        {mode === 'wrong' && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
            错题将从浏览器本地缓存中读取
          </Text>
        )}
        {mode === 'bookmark' && (
          <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
            收藏的题目将从浏览器本地缓存中读取
          </Text>
        )}

        <Input
          placeholder="搜索题目关键词..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />

        <Button
          type="primary"
          size="large"
          block
          disabled={!selectedBank}
          loading={loading}
          onClick={handleStart}
        >
          开始练习
        </Button>

        {stats && (
          <Row gutter={12} style={{ marginTop: 16 }}>
            <Col span={8}>
              <Card size="small" className="home-card">
                <Statistic title="总题数" value={stats.total} valueStyle={{ fontSize: 18 }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="home-card">
                <Statistic title="错题" value={stats.wrong} valueStyle={{ fontSize: 18, color: stats.wrong > 0 ? '#ff4d4f' : undefined }} />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="home-card">
                <Statistic title="收藏" value={stats.bookmark} valueStyle={{ fontSize: 18, color: stats.bookmark > 0 ? '#faad14' : undefined }} />
              </Card>
            </Col>
          </Row>
        )}
      </div>
    </div>
  );
}
