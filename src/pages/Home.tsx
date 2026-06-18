import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Card, Radio, Button, Typography, Input, Statistic, Row, Col } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { BANK_LIST, loadQuestions, getOrderedQuestions, loadWrongIds, loadBookmarkIds, toggleBookmark } from '../utils';
import type { PracticeMode, BankInfo, Question } from '../types';
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

interface SearchResult {
  bank: BankInfo;
  question: Question;
  index: number;
}

export default function Home() {
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [mode, setMode] = useState<PracticeMode>('sequential');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [bookmarks, setBookmarks] = useState<Map<string, Set<string>>>(new Map());
  const allQuestions = useRef<Map<string, Question[]>>(new Map());
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const navigate = useNavigate();
  const { setBank, answers } = useQuiz();

  const handleToggleBookmark = useCallback((bankId: string, questionId: string) => {
    toggleBookmark(bankId, questionId);
    setBookmarks((prev) => {
      const next = new Map(prev);
      const set = new Set(next.get(bankId) || []);
      if (set.has(questionId)) set.delete(questionId);
      else set.add(questionId);
      next.set(bankId, set);
      return next;
    });
  }, []);

  const isBookmarked = useCallback((bankId: string, questionId: string) => {
    return bookmarks.get(bankId)?.has(questionId) || loadBookmarkIds(bankId).has(questionId);
  }, [bookmarks]);

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

  // Load all questions on mount for search
  useEffect(() => {
    let cancelled = false;
    async function loadAll() {
      for (const bank of BANK_LIST) {
        if (cancelled) return;
        try {
          const qs = await loadQuestions(bank.fileName);
          if (!cancelled) allQuestions.current.set(bank.id, qs);
        } catch {
          // ignore
        }
      }
    }
    loadAll();
    return () => { cancelled = true; };
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!search.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    searchTimer.current = setTimeout(() => {
      const kw = search.trim().toLowerCase();
      const results: SearchResult[] = [];
      for (const bank of BANK_LIST) {
        const qs = allQuestions.current.get(bank.id) || [];
        qs.forEach((q, i) => {
          if (
            q.question.toLowerCase().includes(kw) ||
            q.options.some((o) => o.text.toLowerCase().includes(kw))
          ) {
            results.push({ bank, question: q, index: i });
          }
        });
      }
      setSearchResults(results);
      setSearching(false);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const handleStart = async () => {
    if (!selectedBank) return;
    setLoading(true);
    try {
      const questions = await loadQuestions(selectedBank.fileName);
      const wrongIds = loadWrongIds(selectedBank.id);
      const bookmarkIds = loadBookmarkIds(selectedBank.id);
      let ordered = getOrderedQuestions(questions, mode, wrongIds, bookmarkIds);
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
      navigate('/practice');
    } catch {
      alert('恢复进度失败');
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, kw: string) => {
    if (!kw.trim()) return text;
    const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? <mark key={i}>{part}</mark> : part
    );
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
          placeholder="搜索题目关键词，直接查看结果..."
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ marginBottom: 12 }}
        />

        {search.trim() ? (
          <div className="search-results">
            {searching ? (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 20 }}>
                搜索中...
              </Text>
            ) : searchResults.length === 0 ? (
              <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: 20 }}>
                没有找到匹配的题目
              </Text>
            ) : (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: 13 }}>
                  找到 {searchResults.length} 道匹配题目
                </Text>
                <div className="search-list">
                  {searchResults.map((r) => {
                    const correctOpt = r.question.options.find((o) => o.label === r.question.answer);
                    return (
                      <div
                        key={r.question.questionId}
                        className="search-item"
                      >
                        <div className="search-item-header">
                          <span className="search-item-bank">{r.bank.name}</span>
                          <span className="search-item-answer">
                            答案: {r.question.answer}.{correctOpt?.text || ''}
                          </span>
                          <button
                            className={`bookmark-btn-small ${isBookmarked(r.bank.id, r.question.questionId) ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleBookmark(r.bank.id, r.question.questionId);
                            }}
                          >
                            {isBookmarked(r.bank.id, r.question.questionId) ? '★' : '☆'}
                          </button>
                        </div>
                        <div className="search-item-text">
                          {highlightText(r.question.question, search.trim())}
                        </div>
                        <div className="search-item-options">
                          {r.question.options.map((opt) => (
                            <span
                              key={opt.label}
                              className={`search-option ${opt.label === r.question.answer ? 'correct' : ''}`}
                            >
                              {opt.label}. {opt.text}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
