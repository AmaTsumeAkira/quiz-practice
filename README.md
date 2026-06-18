# 题库练习

基于 React + Ant Design 的在线题库练习网站，纯前端，部署在 GitHub Pages。

**在线访问**: https://amatsumeakira.github.io/quiz-practice/

## 功能

- 四种练习模式：顺序练习、乱序练习、错题重练、收藏练习
- 点击选项即时判定对错，答对自动跳转下一题
- 答题卡瀑布流网格，点击跳转
- 答题统计：正确率、已答/未答数量
- 关键词搜索：直接在首页显示匹配题目及正确答案
- 收藏题目：答题页和搜索结果均可收藏
- 进度持久化：答题记录自动保存到 localStorage，刷新不丢失
- 错题记录：自动记录错题，支持错题重练
- 移动端适配：左右滑动切题、响应式布局

## 项目结构

```
quiz-app/
  public/data/         # 题库 JSON 文件
  src/
    types.ts           # 类型定义
    utils.ts           # 工具函数（加载、shuffle、localStorage）
    App.tsx            # 路由 + 布局
    App.css            # 全局样式
    context/QuizContext.tsx  # 状态管理
    pages/Home.tsx     # 首页（选题库、搜索、统计）
    pages/Practice.tsx # 答题页
    components/QuestionCard.tsx  # 题目卡片
    components/AnswerSheet.tsx   # 答题卡
```

## 添加新题库

1. 将 JSON 文件放入 `public/data/` 目录
2. 在 `src/utils.ts` 的 `BANK_LIST` 中添加一项：

```ts
{ id: 'your_bank_id', name: '显示名称', fileName: '文件名.json', count: 题目数量 }
```

JSON 格式：

```json
[
  {
    "questionId": "唯一ID",
    "type": "0",
    "typeName": "单选题",
    "question": "题目文本",
    "options": [
      { "label": "A", "text": "选项A" },
      { "label": "B", "text": "选项B" },
      { "label": "C", "text": "选项C" },
      { "label": "D", "text": "选项D" }
    ],
    "answer": "A"
  }
]
```

## 本地开发

```bash
npm install
npm run dev
```

## 构建部署

```bash
npm run build
```

构建产物在 `dist/` 目录，可直接部署到任意静态托管服务。

GitHub Pages 通过 `.github/workflows/deploy.yml` 自动部署。
