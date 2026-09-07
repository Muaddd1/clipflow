import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// StreamElements' public TTS endpoint (built for their Twitch bot) — free,
// keyless, no signup required. Unofficial, but widely relied on for exactly
// this use case. It has an undocumented per-request character cap, so keep
// narration per scene short.
const MAX_CHARS = 500

export async function POST(req: NextRequest) {
  try {
    const { text, voice } = await req.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }
    if (text.length > MAX_CHARS) {
      return NextResponse.json(
        { error: `Narration too long for TTS (max ${MAX_CHARS} characters per scene)` },
        { status: 400 }
      )
    }

    const selectedVoice = typeof voice === 'string' && voice.trim() ? voice.trim() : 'Brian'
    const url = `https://api.streamelements.com/kappa/v2/speech?voice=${encodeURIComponent(selectedVoice)}&text=${encodeURIComponent(text)}`

    const res = await fetch(url)
    if (!res.ok) {
      return NextResponse.json({ error: `Narration generation failed: ${res.status}` }, { status: 502 })
    }

    const buf = await res.arrayBuffer()
    if (buf.byteLength === 0) {
      return NextResponse.json({ error: 'Narration generation returned no audio' }, { status: 502 })
    }
    const base64 = Buffer.from(buf).toString('base64')

    return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${base64}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Narration generation failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
