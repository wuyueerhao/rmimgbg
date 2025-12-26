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

### 1. 推送代码到 GitHub（已完成）

### 2. 在 Cloudflare Pages 部署

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 连接 GitHub 并选择仓库 `wuyueerhao/rmimgbg`
4. 构建设置：
   - **框架预设**：无（选择"无"）
   - **构建命令**：`npm run build`
   - **构建输出目录**：`out`
   - **Node 版本**：18 或更高
5. **环境变量**（重要！）：
   - 变量名：`REMOVEBG_API_KEY`
   - 值：你的 remove.bg API Key
6. 点击 "Save and Deploy"

### 3. 获取 API Key

访问 [remove.bg](https://www.remove.bg/api) 注册并获取免费 API Key（每月 50 次）

### 重要说明

- 本项目使用 Cloudflare Pages Functions 来处理 API 请求
- API Key 安全存储在 Cloudflare 环境变量中
- `functions/` 目录下的文件会自动部署为 Cloudflare Workers

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- remove.bg API

## 项目结构

```
├── app/
│   ├── page.tsx               # 主页面
│   └── layout.tsx             # 布局
├── components/
│   └── BackgroundRemover.tsx  # 主组件
├── functions/
│   └── api/
│       └── remove-bg.ts       # Cloudflare Pages Function (API 代理)
└── public/                    # 静态资源
```

## 工作原理

- 前端使用 Next.js + React + Tailwind CSS
- API 请求通过 Cloudflare Pages Functions 代理到 remove.bg
- API Key 安全存储在 Cloudflare 环境变量中
- 完全 serverless 架构，无需维护服务器

## 许可证

MIT License
