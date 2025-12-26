'use client'

import { useState, useRef, DragEvent, ChangeEvent, useEffect } from 'react'

interface ImagePair {
  id: string
  original: string
  processed: string | null
  fileName: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  error?: string
}

type ProcessMode = 'api' | 'local'

export default function BackgroundRemover() {
  const [images, setImages] = useState<ImagePair[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [mode, setMode] = useState<ProcessMode>('api')
  const [apiKey, setApiKey] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [removeBackgroundFn, setRemoveBackgroundFn] = useState<any>(null)
  const [modelLoading, setModelLoading] = useState(false)
  const [debugMode, setDebugMode] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 动态加载 @imgly/background-removal
  useEffect(() => {
    if (mode === 'local' && !removeBackgroundFn) {
      // 使用动态导入并处理可能的模块问题
      const loadBackgroundRemoval = async () => {
        setModelLoading(true)
        try {
          // 确保在客户端环境中加载
          if (typeof window !== 'undefined') {
            console.log('开始加载浏览器 AI 模型...')
            
            // 添加超时机制
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('模块加载超时')), 30000) // 30秒超时
            })
            
            const loadPromise = import('@imgly/background-removal')
            
            const module = await Promise.race([loadPromise, timeoutPromise]) as any
            
            if (module && module.removeBackground) {
              console.log('浏览器 AI 模型加载成功')
              setRemoveBackgroundFn(() => module.removeBackground)
            } else {
              throw new Error('模块加载不完整')
            }
          }
        } catch (error) {
          console.error('Failed to load background removal module:', error)
          
          // 根据错误类型提供不同的提示
          let errorMsg = '浏览器 AI 模式加载失败'
          if (error instanceof Error) {
            if (error.message.includes('timeout') || error.message.includes('超时')) {
              errorMsg = '模型加载超时，请检查网络连接'
            } else if (error.message.includes('replace')) {
              errorMsg = '模块兼容性问题，请尝试刷新页面'
            }
          }
          
          // 如果加载失败，切换到 API 模式
          setMode('api')
          alert(`${errorMsg}，已自动切换到 API 模式`)
        } finally {
          setModelLoading(false)
        }
      }
      loadBackgroundRemoval()
    } else if (mode === 'api') {
      setModelLoading(false)
    }
  }, [mode, removeBackgroundFn])

  // 从 localStorage 加载设置
  useEffect(() => {
    const savedMode = localStorage.getItem('processMode') as ProcessMode
    const savedApiKey = localStorage.getItem('removeBgApiKey')
    if (savedMode) setMode(savedMode)
    if (savedApiKey) setApiKey(savedApiKey)
  }, [])

  // 保存设置到 localStorage
  const saveSettings = () => {
    localStorage.setItem('processMode', mode)
    if (apiKey) {
      localStorage.setItem('removeBgApiKey', apiKey)
    }
    setShowSettings(false)
  }

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
      if (mode === 'local') {
        // 使用浏览器端 AI 模型
        await processWithLocalAI(id, file)
      } else {
        // 使用 remove.bg API
        await processWithAPI(id, file)
      }
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

  const processWithAPI = async (id: string, file: File) => {
    const formData = new FormData()
    formData.append('image', file)
    
    // 如果用户提供了自己的 API Key，添加到请求中
    if (apiKey) {
      formData.append('apiKey', apiKey)
    }

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
  }

  const processWithLocalAI = async (id: string, file: File) => {
    if (!removeBackgroundFn) {
      throw new Error('AI 模型加载中，请稍后重试')
    }

    try {
      // 验证文件类型和大小
      if (!file.type.startsWith('image/')) {
        throw new Error('请上传有效的图片文件')
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB 限制
        throw new Error('图片文件过大，请选择小于 10MB 的图片')
      }

      console.log('开始处理图片:', file.name, '大小:', Math.round(file.size / 1024), 'KB')
      
      // 确保传递正确的参数类型
      const blob = await removeBackgroundFn(file, {
        progress: (key: string, current: number, total: number) => {
          const percentage = Math.round((current / total) * 100)
          console.log(`处理进度: ${percentage}%`)
        },
      })

      if (!blob || !(blob instanceof Blob)) {
        throw new Error('AI 处理返回了无效的结果')
      }

      const imageUrl = URL.createObjectURL(blob)
      console.log('图片处理完成:', file.name)

      setImages(prev => prev.map(img =>
        img.id === id
          ? { ...img, processed: imageUrl, status: 'completed' as const }
          : img
      ))
    } catch (error) {
      console.error('Local AI processing error:', error)
      
      // 提供更详细的错误信息
      let errorMessage = '浏览器 AI 处理失败'
      
      if (error instanceof Error) {
        if (error.message.includes('replace')) {
          errorMessage = '模块加载错误，请刷新页面重试'
        } else if (error.message.includes('memory') || error.message.includes('Memory')) {
          errorMessage = '内存不足，请尝试处理更小的图片'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = '网络错误，请检查网络连接'
        } else {
          errorMessage = `处理失败: ${error.message}`
        }
      }
      
      throw new Error(errorMessage)
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
      {/* 标题和设置按钮 */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-4xl font-bold text-gray-800">
          🎨 AI 背景移除工具
        </h1>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          title="设置"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
        <button
          onClick={() => setDebugMode(!debugMode)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-all"
          title="调试模式"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </button>
      </div>

      <p className="text-center text-gray-600 mb-6">
        上传单张或多张图片，自动移除背景
      </p>

      {/* 调试信息 */}
      {debugMode && (
        <div className="mb-6 p-4 bg-gray-100 rounded-lg text-sm">
          <h4 className="font-semibold mb-2">🔧 调试信息</h4>
          <div className="space-y-1 text-gray-700">
            <div>浏览器: {navigator.userAgent}</div>
            <div>模式: {mode}</div>
            <div>模型加载状态: {modelLoading ? '加载中' : '未加载'}</div>
            <div>模型函数: {removeBackgroundFn ? '已加载' : '未加载'}</div>
            <div>支持 WebAssembly: {typeof WebAssembly !== 'undefined' ? '是' : '否'}</div>
            <div>支持 Worker: {typeof Worker !== 'undefined' ? '是' : '否'}</div>
            <div>内存信息: {(performance as any).memory ? 
              `已用: ${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB / 限制: ${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB` 
              : '不可用'}</div>
          </div>
          {mode === 'local' && (
            <button
              onClick={() => {
                setRemoveBackgroundFn(null)
                setModelLoading(false)
              }}
              className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              重置模型
            </button>
          )}
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="mb-6 p-6 bg-gray-50 rounded-xl border-2 border-gray-200">
          <h3 className="text-lg font-semibold mb-4">处理模式设置</h3>
          
          {/* 模式选择 */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="mode-api"
                checked={mode === 'api'}
                onChange={() => setMode('api')}
                className="mt-1"
              />
              <label htmlFor="mode-api" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-800">remove.bg API 模式</div>
                <div className="text-sm text-gray-600">
                  使用 remove.bg 云端 API，处理速度快，质量高
                  {!apiKey && <span className="text-orange-600">（使用服务器默认 API Key，每月 50 次限制）</span>}
                </div>
              </label>
            </div>

            {mode === 'api' && (
              <div className="ml-6 space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  自定义 API Key（可选）
                </label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 remove.bg API Key"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500">
                  从 <a href="https://www.remove.bg/api" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">remove.bg</a> 获取免费 API Key（每月 50 次）
                </p>
              </div>
            )}

            <div className="flex items-start gap-3">
              <input
                type="radio"
                id="mode-local"
                checked={mode === 'local'}
                onChange={() => setMode('local')}
                className="mt-1"
              />
              <label htmlFor="mode-local" className="flex-1 cursor-pointer">
                <div className="font-medium text-gray-800">浏览器端 AI 模式</div>
                <div className="text-sm text-gray-600">
                  完全免费，无限次数，隐私安全，但首次加载需下载 ~40MB 模型
                </div>
              </label>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={saveSettings}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all"
            >
              保存设置
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-all"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 当前模式指示 */}
      <div className="mb-6 flex items-center justify-center gap-2 text-sm">
        <span className="text-gray-600">当前模式:</span>
        <span className={`px-3 py-1 rounded-full font-medium ${
          mode === 'api' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-green-100 text-green-700'
        }`}>
          {mode === 'api' ? '🌐 API 模式' : '🤖 浏览器 AI 模式'}
        </span>
        {mode === 'local' && modelLoading && (
          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full font-medium">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin"></div>
              模型加载中...
            </div>
          </span>
        )}
        {mode === 'local' && !modelLoading && removeBackgroundFn && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
            ✅ 模型已就绪
          </span>
        )}
      </div>

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
