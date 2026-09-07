import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 30

// Google Translate's unofficial TTS endpoint — free, keyless, no signup.
// Long-standing community trick (no relation to the official Cloud TTS API).
// It has an undocumented per-request character cap, so long narration is
// split on sentence boundaries and the resulting MP3 chunks are concatenated.
const CHUNK_CHARS = 200
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

// Verified distinct-sounding accents for this endpoint — most other region
// codes (e.g. en-GB) silently collapse to the same voice as plain "en".
const ALLOWED_ACCENTS = new Set(['en', 'en-AU', 'en-IN'])

function splitIntoChunks(text: string, maxLen: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text]
  const chunks: string[] = []
  let current = ''
  for (const sentence of sentences) {
    if (current && (current + sentence).length > maxLen) {
      chunks.push(current.trim())
      current = sentence
    } else {
      current += sentence
    }
  }
  if (current.trim()) chunks.push(current.trim())

  // Hard-split anything still over the limit (one very long sentence).
  const final: string[] = []
  for (const c of chunks) {
    if (c.length <= maxLen) {
      final.push(c)
    } else {
      for (let i = 0; i < c.length; i += maxLen) final.push(c.slice(i, i + maxLen))
    }
  }
  return final
}

export async function POST(req: NextRequest) {
  try {
    const { text, accent } = await req.json()

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    const lang = ALLOWED_ACCENTS.has(accent) ? accent : 'en'
    const chunks = splitIntoChunks(text.trim(), CHUNK_CHARS)

    const buffers: Buffer[] = []
    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&q=${encodeURIComponent(chunk)}&tl=${lang}`
      const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
      if (!res.ok) {
        return NextResponse.json({ error: `Narration generation failed: ${res.status}` }, { status: 502 })
      }
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length === 0) {
        return NextResponse.json({ error: 'Narration generation returned no audio' }, { status: 502 })
      }
      buffers.push(buf)
    }

    const combined = Buffer.concat(buffers)
    return NextResponse.json({ audioUrl: `data:audio/mpeg;base64,${combined.toString('base64')}` })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Narration generation failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
