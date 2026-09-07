import OpenAI from 'openai'

export function getOpenAIClient(): OpenAI | null {
  if (typeof window === 'undefined') return null
  const key = localStorage.getItem('clipflow-openai-key')
  if (!key) return null
  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true })
}

export async function testAIConnection(): Promise<boolean> {
  const client = getOpenAIClient()
  if (!client) return false
  try {
    await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say "Connection OK" in exactly those words.' }],
      max_tokens: 10,
    })
    return true
  } catch {
    return false
  }
}

export function buildScriptPrompt(
  topic: string,
  platform: string,
  contentType: string,
  tone: string,
  duration: string
): string {
  return `You are an expert viral content scriptwriter for ${platform} creators.

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
}

export interface ParsedScript {
  hooks: string[]
  titles: string[]
  hook: string
  introduction: string
  body: string[]
  cta: string
  wordCount: number
  readTime: string
  raw: string
}

export function parseScriptOutput(raw: string): ParsedScript {
  const result: Partial<ParsedScript> = { raw }

  // Hooks
  const hookMatch = raw.match(/HOOK_OPTIONS:\n([\s\S]*?)(?=TITLE_OPTIONS:)/)
  if (hookMatch) {
    result.hooks = hookMatch[1]
      .split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
  }

  // Titles
  const titleMatch = raw.match(/TITLE_OPTIONS:\n([\s\S]*?)(?=SCRIPT_OUTLINE:)/)
  if (titleMatch) {
    result.titles = titleMatch[1]
      .split('\n')
      .map(l => l.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
  }

  // Script outline sections
  const outline = raw.match(/SCRIPT_OUTLINE:([\s\S]*?)(?=---*$)/m)
  if (outline) {
    const content = outline[1]
    const hookSec = content.match(/## HOOK\n([\s\S]*?)(?=## INTRODUCTION)/)
    if (hookSec) result.hook = hookSec[1].trim()

    const introSec = content.match(/## INTRODUCTION\n([\s\S]*?)(?=## MAIN POINT)/)
    if (introSec) result.introduction = introSec[1].trim()

    const mainPoints: string[] = []
    const points = content.match(/## MAIN POINT \d+\n([\s\S]*?)(?=(?:## CALL TO ACTION|$))/g)
    if (points) {
      for (const p of points) {
        mainPoints.push(p.replace(/## MAIN POINT \d+\n/, '').trim())
      }
    }
    result.body = mainPoints

    const ctaSec = content.match(/## CALL TO ACTION\n([\s\S]*?)(?=---*$)/m)
    if (ctaSec) result.cta = ctaSec[1].trim()
  }

  // Word count
  const wcMatch = raw.match(/ESTIMATED_WORD_COUNT:\s*(\d+)/)
  result.wordCount = wcMatch ? parseInt(wcMatch[1]) : 0

  // Read time
  const rtMatch = raw.match(/ESTIMATED_READ_TIME:\s*(.+)/)
  result.readTime = rtMatch ? rtMatch[1].trim() : '0 min'

  // Fallbacks
  if (!result.hooks?.length) result.hooks = []
  if (!result.titles?.length) result.titles = []
  if (!result.hook) result.hook = ''
  if (!result.introduction) result.introduction = ''
  if (!result.body?.length) result.body = []
  if (!result.cta) result.cta = ''

  return result as ParsedScript
}

export async function generateScript(
  topic: string,
  platform: string,
  contentType: string,
  tone: string,
  duration: string,
  model = 'gpt-4o'
): Promise<ParsedScript> {
  const client = getOpenAIClient()
  if (!client) throw new Error('No API key configured. Add your key in Settings > AI.')

  const prompt = buildScriptPrompt(topic, platform, contentType, tone, duration)

  const response = await client.chat.completions.create({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  })

  const raw = response.choices[0]?.message?.content ?? ''
  return parseScriptOutput(raw)
}
