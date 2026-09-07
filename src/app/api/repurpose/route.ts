import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { key, sourceTitle, sourceDescription, sourcePlatform, targetPlatform, sourceContent, model } = await req.json()

    if (!key) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 401 })
    }

    const platformDescriptions: Record<string, string> = {
      tiktok: 'TikTok — short-form, punchy, trending sounds, hook in first 1-3 seconds, conversational, often POV or reaction style',
      x: 'X (Twitter) — punchy threads or single tweets, max engagement, hook immediately, often controversial or counterintuitive takes',
      instagram: 'Instagram — carousels or Reels, visual-first thinking, caption should complement the content, call-to-action for saves/shares',
      linkedin: 'LinkedIn — professional but personal, storytelling format, insights-first, ends with question to drive comments',
      youtube: 'YouTube — long-form script adaptation, hook + value proposition, timestamps if needed',
    }

    const targetDesc = platformDescriptions[targetPlatform] || targetPlatform

    const prompt = `You are an expert content repurposing strategist.

Take this existing content and adapt it for ${targetPlatform.toUpperCase()}.

SOURCE CONTENT:
Title: "${sourceTitle}"
${sourceDescription ? `Description: "${sourceDescription}"` : ''}
Original Platform: ${sourcePlatform}
${sourceContent ? `\nFull Content/Script:\n${sourceContent}` : ''}

TARGET PLATFORM: ${targetPlatform.toUpperCase()}
Platform style: ${targetDesc}

Generate exactly 3 different repurposed outputs for ${targetPlatform}.

Respond with EXACTLY this format (no numbering, use this exact format):

---
OUTPUT_1:
[Full repurposed content for ${targetPlatform}, adapted to fit that platform's style, conventions, and best practices. Make it feel native to ${targetPlatform}, not just a copy.]

---
OUTPUT_2:
[Second different angle or approach on the same content for ${targetPlatform}.]

---
OUTPUT_3:
[Third different angle or approach on the same content for ${targetPlatform}.]
---`

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
    return NextResponse.json({ error: err.message || 'Repurposing failed' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
