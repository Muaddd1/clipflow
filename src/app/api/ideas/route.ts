import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { key, niche, platform, category, count, model } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 })
    }

    const prompt = `You are an expert viral content strategist for ${platform} creators.

Generate ${count || 5} highly engaging content ideas for the following niche/topic: "${niche}"

Platform: ${platform}
Category: ${category}

Respond with EXACTLY this format (one idea per line, no numbering, use this exact prefix):

---
IDEA: [Compelling title that hooks viewers immediately]
HOOK: [1-2 sentence hook that stops the scroll]
ANGLE: [The unique perspective or angle that makes this different]
TOPIC: [The specific topic/theme]
TRENDING: [Yes/No - is this currently trending?]
VIRAL_POTENTIAL: [High/Medium/Low]
DIFFICULTY: [Easy/Medium/Hard - how hard to produce]
---

Generate ${count || 5} ideas.`

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.9,
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
