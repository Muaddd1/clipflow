import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { key, topic, platform, tone, sceneCount, model } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 })
    }
    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    const scenes = Math.min(Math.max(Number(sceneCount) || 6, 3), 10)

    const prompt = `You are an expert short-form video scriptwriter for ${platform || 'YouTube'} Shorts/Reels/TikTok.

Write a ${scenes}-scene faceless video script for: "${topic}"

Tone: ${tone || 'Casual'}
Aim for roughly 30-60 seconds of total spoken narration (about 12-20 words per scene).

Rules:
- Scene 1's narration MUST open with a scroll-stopping hook in its first sentence.
- The final scene's narration MUST end with a clear call to action (follow, like, comment, or similar).
- Each VISUAL description must describe only a background scene/image, in vivid concrete detail — no on-screen text, no words, no logos, no letters, since it will be fed to an AI image generator.
- Narration should sound natural when spoken aloud, not like written prose.

Respond with EXACTLY this format (use the exact section headers and the "---" separators):

TITLE_OPTIONS:
1. [title 1 - clickworthy, SEO-friendly]
2. [title 2]
3. [title 3]

---
SCENE:
NARRATION: [spoken line for scene 1]
VISUAL: [background visual description for scene 1]
---
SCENE:
NARRATION: [spoken line for scene 2]
VISUAL: [background visual description for scene 2]
---
(continue with a "---" separated SCENE block for all ${scenes} scenes, in order)`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.85,
      }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: error.error?.message || `Groq error: ${response.status}` },
        { status: response.status }
      )
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content ?? ''

    return NextResponse.json({ raw })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
