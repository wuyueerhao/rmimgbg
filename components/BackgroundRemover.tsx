'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

export default function BackgroundRemover() {
  const [originalImage, setOriginalImage] = useState<string | null>(null)
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件')
      return
    }

    // 显示原图
    const reader = new FileReader()
    reader.onload = (e) => {
      setOriginalImage(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // 处理图片
    setLoading(true)
    setProcessedImage(null)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/remove-bg', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '处理失败')
      }

      const blob = await response.blob()
      const imageUrl = URL.createObjectURL(blob)
      setProcessedImage(imageUrl)
    } catch (error) {
      console.error('Error:', error)
      alert(error instanceof Error ? error.message : '处理图片时出错，请重试')
      reset()
    } finally {
      setLoading(false)
    }
  }

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleDownload = () => {
    if (processedImage) {
      const a = document.createElement('a')
      a.href = processedImage
      a.download = 'removed-background.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const reset = () => {
    setOriginalImage(null)
    setProcessedImage(null)
    setLoading(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
        🎨 AI 背景移除工具
      </h1>
      <p className="text-center text-gray-600 mb-8">
        上传图片，自动移除背景
      </p>

      {!originalImage && !loading && (
        <div
          className={`border-4 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-purple-600 bg-purple-50 scale-105'
              : 'border-purple-400 bg-purple-50 hover:bg-purple-100'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
          />
          <svg
            className="w-16 h-16 mx-auto mb-4 text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-xl text-gray-700 mb-2">
            点击或拖拽图片到这里
          </p>
          <span className="text-sm text-gray-500">
            支持 JPG, PNG, WEBP 格式
          </span>
        </div>
      )}

      {loading && (
        <div className="text-center py-16">
          <div className="inline-block w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-700 text-lg">正在处理图片...</p>
        </div>
      )}

      {originalImage && !loading && (
        <div className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                原图
              </h3>
              <img
                src={originalImage}
                alt="原图"
                className="w-full rounded-lg shadow-md"
              />
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                移除背景后
              </h3>
              {processedImage ? (
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-lg"
                    style={{
                      backgroundImage:
                        'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                  />
                  <img
                    src={processedImage}
                    alt="处理后"
                    className="relative w-full rounded-lg shadow-md"
                  />
                </div>
              ) : (
                <div className="w-full h-64 flex items-center justify-center bg-gray-200 rounded-lg">
                  <p className="text-gray-500">处理中...</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleDownload}
              disabled={!processedImage}
              className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-800 text-white rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              下载图片
            </button>
            <button
              onClick={reset}
              className="px-8 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-all"
            >
              重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
