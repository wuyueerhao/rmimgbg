export async function onRequest(context: any) {
  const { request, env } = context

  // 只允许 POST 请求
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const formData = await request.formData()
    const image = formData.get('image')

    if (!image) {
      return new Response(JSON.stringify({ error: '请上传图片' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const apiKey = env.REMOVEBG_API_KEY

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: '服务器配置错误：缺少 API Key' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
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
      return new Response(
        JSON.stringify({ error: '处理图片失败，请稍后重试' }),
        {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    const imageBlob = await response.blob()

    return new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/png',
      },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
