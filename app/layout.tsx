import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI 背景移除工具',
  description: '使用 AI 自动移除图片背景',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg" />
      </head>
      <body>{children}</body>
    </html>
  )
}
