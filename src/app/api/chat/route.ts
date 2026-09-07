import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { key, topic, platform, contentType, tone, duration, model } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 })
    }

    const prompt = `You are an expert viral content scriptwriter for ${platform}.

Generate a script outline for: "${topic}"

Platform: ${platform}
Content Type: ${contentType}
Tone: ${tone}
Duration: ${duration}

Respond with EXACTLY this format (use the exact section headers):

---
HOOK_OPTIONS:
1. [hook 1 - 1-2 sentences, designed to stop scroll]
2. [hook 2 - 1-2 sentences]
3. [hook 3 - 1-2 sentences]

TITLE_OPTIONS:
1. [title 1 - clickworthy, SEO-friendly]
2. [title 2]
3. [title 3]

SCRIPT_OUTLINE:

## HOOK
[2-3 sentences. Strong opening line that creates curiosity or conflict.]

## INTRODUCTION
[30-60 seconds. Introduce yourself, set context, preview what they'll learn/feel.]

## MAIN POINT 1
[Core insight #1. State it clearly, support with a story, statistic, or example.]

## MAIN POINT 2
[Core insight #2. Different angle or deeper dive into the topic.]

## MAIN POINT 3
[Core insight #3. The payoff — the most valuable takeaway.]

## CALL TO ACTION
[Specific action: like, subscribe, comment, visit link. Match platform conventions.]

---
ESTIMATED_WORD_COUNT: [number]
ESTIMATED_READ_TIME: [X minutes]
---`

    // Groq API — free tier, no credit card needed
    // Sign up at https://console.groq.com
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-20b',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.8,
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
