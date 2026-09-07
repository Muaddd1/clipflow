import { NextRequest, NextResponse } from 'next/server'

// Pollinations can take a while for a cold model — give it real headroom
// so this doesn't repeat the timeout mistake the thumbnail route had.
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const { prompt, width, height, seed } = await req.json()

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const w = Math.min(Math.max(Number(width) || 720, 256), 1024)
    const h = Math.min(Math.max(Number(height) || 1280, 256), 1920)
    const s = Number.isFinite(seed) ? Math.floor(seed) : Math.floor(Math.random() * 1_000_000)

    // Pollinations.ai — free, keyless image generation, no signup required.
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&nologo=true&seed=${s}`

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: `Image generation failed: ${res.status}` }, { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buf = await res.arrayBuffer()
    if (buf.byteLength === 0) {
      return NextResponse.json({ error: 'Image generation returned no data' }, { status: 502 })
    }
    const base64 = Buffer.from(buf).toString('base64')

    return NextResponse.json({ imageUrl: `data:${contentType};base64,${base64}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Image generation failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
