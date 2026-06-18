import { useState } from 'react';
import { Card, Radio, Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { BANK_LIST, loadQuestions, getOrderedQuestions, loadWrongIds } from '../utils';
import type { PracticeMode, BankInfo } from '../types';
import { useQuiz } from '../context/QuizContext';

const { Title, Text } = Typography;

export default function Home() {
  const [selectedBank, setSelectedBank] = useState<BankInfo | null>(null);
  const [mode, setMode] = useState<PracticeMode>('sequential');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setBank } = useQuiz();

  const handleStart = async () => {
    if (!selectedBank) return;
    setLoading(true);
    try {
      const questions = await loadQuestions(selectedBank.fileName);
      const wrongIds = loadWrongIds(selectedBank.id);
      const ordered = getOrderedQuestions(questions, mode, wrongIds);
      if (ordered.length === 0) {
        alert('当前没有错题可练习');
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

  return (
    <div className="home">
      <div className="home-content">
        <Title level={3} style={{ marginBottom: 32 }}>题库练习</Title>
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
          </Radio.Group>
        </Card>

        <Button
          type="primary"
          size="large"
          block
          disabled={!selectedBank}
          loading={loading}
          onClick={handleStart}
          style={{ marginTop: 16 }}
        >
          开始练习
        </Button>

        {selectedBank && mode === 'wrong' && (
          <Text type="secondary" style={{ display: 'block', marginTop: 12, textAlign: 'center' }}>
            错题将从浏览器本地缓存中读取
          </Text>
        )}
      </div>
    </div>
  );
}
