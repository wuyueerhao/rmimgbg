'use client'

import { useState, useRef, DragEvent, ChangeEvent } from 'react'

interface ImagePair {
  id: string
  original: string
  processed: string | null
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

export default function BackgroundRemover() {
  const [images, setImages] = useState<ImagePair[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = async (files: FileList) => {
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )

    if (imageFiles.length === 0) {
      alert('请上传图片文件')
      return
    }

    // 创建新的图片对象
    const newImages: ImagePair[] = await Promise.all(
      imageFiles.map(async (file) => {
        const reader = new FileReader()
        const original = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })

        return {
          id: Math.random().toString(36).substr(2, 9),
          original,
          processed: null,
          fileName: file.name,
          status: 'pending' as const,
        }
      })
    )

    setImages(prev => [...prev, ...newImages])

    // 逐个处理图片
    for (const img of newImages) {
      await processImage(img.id, imageFiles.find(f => f.name === img.fileName)!)
    }
  }

  const processImage = async (id: string, file: File) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, status: 'processing' as const } : img
    ))

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

      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, processed: imageUrl, status: 'completed' as const }
          : img
      ))
    } catch (error) {
      console.error('Error:', error)
      setImages(prev => prev.map(img =>
        img.id === id
          ? {
              ...img,
              status: 'error' as const,
              error: error instanceof Error ? error.message : '处理失败',
            }
          : img
      ))
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDownload = (img: ImagePair) => {
    if (img.processed) {
      const a = document.createElement('a')
      a.href = img.processed
      a.download = `removed-${img.fileName}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  const handleDownloadAll = () => {
    images
      .filter(img => img.processed)
      .forEach(img => handleDownload(img))
  }

  const removeImage = (id: string) => {
    setImages(prev => prev.filter(img => img.id !== id))
  }

  const reset = () => {
    setImages([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const processingCount = images.filter(img => img.status === 'processing').length
  const completedCount = images.filter(img => img.status === 'completed').length

  return (
    <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl p-8">
      <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">
        🎨 AI 背景移除工具
      </h1>
      <p className="text-center text-gray-600 mb-8">
        上传单张或多张图片，自动移除背景
      </p>

      {images.length === 0 && (
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
            multiple
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
            支持 JPG, PNG, WEBP 格式 | 支持批量上传
          </span>
        </div>
      )}

      {images.length > 0 && (
        <div className="space-y-6">
          {/* 进度统计 */}
          <div className="flex items-center justify-between bg-purple-50 rounded-lg p-4">
            <div className="flex gap-6">
              <span className="text-gray-700">
                总计: <strong>{images.length}</strong> 张
              </span>
              <span className="text-blue-600">
                处理中: <strong>{processingCount}</strong> 张
              </span>
              <span className="text-green-600">
                已完成: <strong>{completedCount}</strong> 张
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
              >
                继续添加
              </button>
              {completedCount > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-all"
                >
                  下载全部
                </button>
              )}
              <button
                onClick={reset}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg text-sm hover:bg-gray-300 transition-all"
              >
                清空列表
              </button>
            </div>
          </div>

          {/* 图片列表 */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((img) => (
              <div
                key={img.id}
                className="bg-gray-50 rounded-xl p-4 relative"
              >
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all z-10"
                >
                  ×
                </button>

                <div className="space-y-3">
                  {/* 原图 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-1 truncate">
                      {img.fileName}
                    </p>
                    <img
                      src={img.original}
                      alt="原图"
                      className="w-full h-40 object-cover rounded-lg"
                    />
                  </div>

                  {/* 处理后的图片 */}
                  <div>
                    {img.status === 'processing' && (
                      <div className="w-full h-40 flex flex-col items-center justify-center bg-gray-200 rounded-lg">
                        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <p className="text-xs text-gray-500">处理中...</p>
                      </div>
                    )}

                    {img.status === 'completed' && img.processed && (
                      <div className="relative">
                        <div
                          className="absolute inset-0 rounded-lg"
                          style={{
                            backgroundImage:
                              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                            backgroundSize: '10px 10px',
                            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                          }}
                        />
                        <img
                          src={img.processed}
                          alt="处理后"
                          className="relative w-full h-40 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {img.status === 'error' && (
                      <div className="w-full h-40 flex flex-col items-center justify-center bg-red-50 rounded-lg">
                        <p className="text-xs text-red-600 px-2 text-center">
                          {img.error || '处理失败'}
                        </p>
                      </div>
                    )}

                    {img.status === 'pending' && (
                      <div className="w-full h-40 flex items-center justify-center bg-gray-100 rounded-lg">
                        <p className="text-xs text-gray-500">等待处理...</p>
                      </div>
                    )}
                  </div>

                  {/* 下载按钮 */}
                  {img.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(img)}
                      className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-all"
                    >
                      下载
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleChange}
        className="hidden"
      />
    </div>
  )
}
