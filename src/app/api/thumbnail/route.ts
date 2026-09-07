import { NextResponse } from 'next/server'

// Replicate generations typically take 20-40s; the poll loop below budgets
// for up to 60s, so the function needs a matching max duration or it gets
// killed by the platform's 10s default long before Replicate finishes.
export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { apiKey, prompt, aspectRatio, test } = await request.json()

    if (!apiKey) {
      return NextResponse.json({ error: 'Replicate API key required' }, { status: 400 })
    }

    if (test) {
      // Quick validation - try a minimal prediction
      const response = await fetch('https://api.replicate.com/v1/models', {
        headers: {
          'Authorization': `Token ${apiKey}`,
        },
      })
      if (!response.ok) {
        const err = await response.json()
        return NextResponse.json({ error: err.detail || 'Invalid API key' }, { status: 401 })
      }
      return NextResponse.json({ success: true })
    }

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Resolve aspect ratio to dimensions
    const dimensions: Record<string, { width: number; height: number }> = {
      '16:9': { width: 1280, height: 720 },
      '9:16': { width: 1080, height: 1920 },
      '1:1':  { width: 1024, height: 1024 },
      '4:5':  { width: 1024, height: 1280 },
    }
    const { width, height } = dimensions[aspectRatio] || dimensions['16:9']

    // Get the latest version ID for FLUX Kontext Pro
    const modelRes = await fetch('https://api.replicate.com/v1/models/black-forest-labs/flux-kontext-pro', {
      headers: { 'Authorization': `Token ${apiKey}` },
    })
    if (!modelRes.ok) {
      const err = await modelRes.json()
      return NextResponse.json({ error: err.detail || 'Failed to fetch model info' }, { status: 500 })
    }
    const modelData = await modelRes.json()
    const versionId = modelData.latest_version?.id
    if (!versionId) {
      return NextResponse.json({ error: 'Could not find model version' }, { status: 500 })
    }

    // Create prediction
    const createRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: versionId,
        input: {
          prompt: prompt,
          width: width,
          height: height,
          num_inference_steps: 30,
          guidance_scale: 7.5,
          num_outputs: 1,
        },
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      return NextResponse.json({ error: err.detail || 'Failed to start generation' }, { status: 500 })
    }

    const prediction = await createRes.json()

    // Poll for completion
    let finalPrediction = prediction
    for (let i = 0; i < 60; i++) { // poll up to 60 times (~60s)
      await new Promise(r => setTimeout(r, 1000))
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: { 'Authorization': `Token ${apiKey}` },
      })
      finalPrediction = await pollRes.json()
      if (finalPrediction.status === 'succeeded') break
      if (finalPrediction.status === 'failed') {
        return NextResponse.json({ error: finalPrediction.error || 'Generation failed' }, { status: 500 })
      }
    }

    if (finalPrediction.status !== 'succeeded') {
      return NextResponse.json({ error: 'Generation timed out' }, { status: 504 })
    }

    // Fetch the generated image
    const output = finalPrediction.output
    const outputUrl = Array.isArray(output) ? output?.[0] : output
    if (!outputUrl || typeof outputUrl !== 'string') {
      return NextResponse.json({ error: 'No image output received' }, { status: 500 })
    }

    const imageRes = await fetch(outputUrl)
    const imageBuffer = await imageRes.arrayBuffer()
    const base64 = Buffer.from(imageBuffer).toString('base64')
    const dataUrl = `data:image/jpeg;base64,${base64}`

    return NextResponse.json({ imageUrl: dataUrl, predictionId: finalPrediction.id })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 })
  }
}
