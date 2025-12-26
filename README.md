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

### 方法 1：通过 Cloudflare Dashboard（推荐）

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages**
3. 连接 GitHub 并选择仓库 `wuyueerhao/rmimgbg`
4. 构建设置：
   - **框架预设**：Next.js (Static HTML Export)
   - **构建命令**：`npm run build`
   - **构建输出目录**：`out`
5. **环境变量**：
   - 添加 `REMOVEBG_API_KEY` = 你的 API Key
6. 点击 "Save and Deploy"

### 方法 2：使用 Vercel（更简单）

如果 Cloudflare Pages 有问题，可以使用 Vercel：

1. 访问 [vercel.com](https://vercel.com)
2. 导入 GitHub 仓库
3. 添加环境变量 `REMOVEBG_API_KEY`
4. 部署

### 注意事项

- 确保在部署平台添加了 `REMOVEBG_API_KEY` 环境变量
- API Key 从 [remove.bg](https://www.remove.bg/api) 获取
- 免费账号每月有 50 次处理限制

## 技术栈

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- remove.bg API

## 项目结构

```
├── app/
│   ├── api/
│   │   └── remove-bg/
│   │       └── route.ts      # API 路由（保护 API Key）
│   ├── page.tsx               # 主页面
│   └── layout.tsx             # 布局
├── components/
│   └── BackgroundRemover.tsx  # 主组件
└── public/                    # 静态资源
```

## 许可证

MIT License
