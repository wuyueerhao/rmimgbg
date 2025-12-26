import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const image = formData.get('image') as File

    if (!image) {
      return NextResponse.json(
        { error: '请上传图片' },
        { status: 400 }
      )
    }

    const apiKey = process.env.REMOVEBG_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: '服务器配置错误：缺少 API Key' },
        { status: 500 }
      )
    }

    // 调用 remove.bg API
    const removeBgFormData = new FormData()
    removeBgFormData.append('image_file', image)
    removeBgFormData.append('size', 'auto')

    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: removeBgFormData,
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('remove.bg API error:', error)
      return NextResponse.json(
        { error: '处理图片失败，请稍后重试' },
        { status: response.status }
      )
    }

    const imageBlob = await response.blob()
    
    return new NextResponse(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
