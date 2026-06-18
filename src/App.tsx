import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, Layout, Typography } from 'antd';
import { QuizProvider } from './context/QuizContext';
import Home from './pages/Home';
import Practice from './pages/Practice';
import './App.css';

const { Header, Content } = Layout;
const { Text } = Typography;

function AppLayout() {
  return (
    <Layout className="app-layout">
      <Header className="app-header">
        <Text strong style={{ color: '#333', fontSize: 16 }}>题库练习</Text>
      </Header>
      <Content className="app-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/practice" element={<Practice />} />
        </Routes>
      </Content>
    </Layout>
  );
}

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4a6fa5',
          borderRadius: 6,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
        },
      }}
    >
      <BrowserRouter>
        <QuizProvider>
          <AppLayout />
        </QuizProvider>
      </BrowserRouter>
    </ConfigProvider>
  );
}
