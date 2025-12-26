# AI 背景移除工具

一个简单易用的在线图片背景移除工具，使用 Next.js 和 remove.bg API 实现自动背景移除功能。

## 功能特点

- 🎨 自动移除图片背景
- 📱 响应式设计，支持移动端
- 🖱️ 支持拖拽上传
- 💾 一键下载处理后的图片
- ⚡ 快速处理
- 🔒 API Key 安全存储在服务端

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件：

```env
REMOVEBG_API_KEY=你的_remove.bg_API_Key
```

获取 API Key：访问 [remove.bg](https://www.remove.bg/api) 注册并获取免费 API Key（每月 50 次）

### 3. 本地运行

```bash
npm run dev
```

访问 http://localhost:3000

## 部署到 Cloudflare Pages

### 1. 推送到 GitHub

```bash
git add .
git commit -m "Update: Use client-side AI model"
git push
```

### 2. 在 Cloudflare Pages 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Pages → Create a project
3. 连接 GitHub 并选择你的仓库
4. 构建设置：
   - 框架预设：`Next.js`
   - 构建命令：`npm run build`
   - 构建输出目录：`.next`
5. 点击 "Save and Deploy"

无需配置任何环境变量！

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- @imgly/background-removal (ONNX Runtime + WebAssembly)

## 工作原理

使用 [@imgly/background-removal](https://github.com/imgly/background-removal-js) 库，它：
- 在浏览器中运行预训练的 AI 模型
- 使用 ONNX Runtime Web 和 WebAssembly
- 首次加载会下载约 40MB 的模型文件（会被缓存）
- 完全客户端处理，保护用户隐私

## 项目结构

```
├── app/
│   ├── page.tsx               # 主页面
│   └── layout.tsx             # 布局
├── components/
│   └── BackgroundRemover.tsx  # 主组件
└── public/                    # 静态资源
```

## 许可证

MIT License
