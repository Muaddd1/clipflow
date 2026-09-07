import OpenAI from 'openai'

export function getOpenAIClient(): OpenAI | null {
  if (typeof window === 'undefined') return null
  const key = localStorage.getItem('clipflow-openai-key')
  if (!key) return null

  // sk-proj- keys use the full key with a default project
  if (key.startsWith('sk-proj-')) {
    return new OpenAI({ apiKey: key, project: 'default', dangerouslyAllowBrowser: true })
  }

  return new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true })
}

export async function testAIConnection(): Promise<boolean> {
  const client = getOpenAIClient()
  if (!client) return false
  try {
    // Use the Groq-compatible test via the API route instead of OpenAI SDK directly
    const key = localStorage.getItem('clipflow-openai-key')
    const model = localStorage.getItem('clipflow-ai-model') || 'openai/gpt-oss-20b'
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, topic: 'test', platform: 'youtube', contentType: 'Tutorial', tone: 'Casual', duration: '1-3 min', model }),
    })
    return response.ok
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
  model?: string
): Promise<ParsedScript> {
  if (typeof window === 'undefined') throw new Error('Cannot call generateScript on server')

  const key = localStorage.getItem('clipflow-openai-key')
  if (!key) throw new Error('No API key configured. Add your key in Settings > AI.')

  // Use saved model from settings, fallback to gpt-oss-20b
  const savedModel = localStorage.getItem('clipflow-ai-model') || 'openai/gpt-oss-20b'
  const selectedModel = model || savedModel

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, topic, platform, contentType, tone, duration, model: selectedModel }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  const data = await response.json()
  return parseScriptOutput(data.raw)
}

export interface ParsedIdea {
  title: string
  hook: string
  angle: string
  topic: string
  trending: boolean
  viralPotential: 'High' | 'Medium' | 'Low'
  difficulty: 'Easy' | 'Medium' | 'Hard'
  raw: string
}

export function parseIdeasOutput(raw: string): ParsedIdea[] {
  const ideas: ParsedIdea[] = []
  if (!raw || !raw.trim()) return ideas

  // Flexible regex - allows numbers, dashes, varying whitespace
  const blocks = raw.split(/--+/)
  for (const block of blocks) {
    const trimmed = block.trim()
    if (!trimmed) continue

    const ideaMatch = trimmed.match(/IDEA:\s*(.+)/i)
    const hookMatch = trimmed.match(/HOOK:\s*(.+)/i)
    const angleMatch = trimmed.match(/ANGLE:\s*(.+)/i)
    const topicMatch = trimmed.match(/TOPIC:\s*(.+)/i)
    const trendingMatch = trimmed.match(/TRENDING:\s*(Yes|No)/i)
    const viralMatch = trimmed.match(/VIRAL[_\s]?POTENTIAL:\s*(High|Medium|Low)/i)
    const diffMatch = trimmed.match(/DIFFICULTY:\s*(Easy|Medium|Hard)/i)

    if (ideaMatch) {
      ideas.push({
        title: ideaMatch[1].trim().replace(/^\d+[\.\)]\s*/, ''),
        hook: hookMatch ? hookMatch[1].trim() : '',
        angle: angleMatch ? angleMatch[1].trim() : '',
        topic: topicMatch ? topicMatch[1].trim() : '',
        trending: trendingMatch ? trendingMatch[1].toLowerCase() === 'yes' : false,
        viralPotential: (viralMatch ? viralMatch[1] : 'Medium') as 'High' | 'Medium' | 'Low',
        difficulty: (diffMatch ? diffMatch[1] : 'Medium') as 'Easy' | 'Medium' | 'Hard',
        raw: trimmed,
      })
    }
  }
  return ideas
}

export async function generateIdeas(
  niche: string,
  platform: string,
  category: string,
  count = 5,
  model?: string
): Promise<ParsedIdea[]> {
  if (typeof window === 'undefined') throw new Error('Cannot call generateIdeas on server')

  const key = localStorage.getItem('clipflow-openai-key')
  if (!key) throw new Error('No API key configured. Add your key in Settings > AI.')

  const savedModel = localStorage.getItem('clipflow-ai-model') || 'openai/gpt-oss-20b'
  const selectedModel = model || savedModel

  const response = await fetch('/api/ideas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, niche, platform, category, count, model: selectedModel }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  const data = await response.json()
  return parseIdeasOutput(data.raw)
}

export interface RepurposeOutput {
  content: string
  index: number
}

export async function repurposeContent(
  sourceTitle: string,
  sourceDescription: string,
  sourcePlatform: string,
  targetPlatform: string,
  sourceContent?: string,
  model?: string
): Promise<RepurposeOutput[]> {
  if (typeof window === 'undefined') throw new Error('Cannot call repurposeContent on server')

  const key = localStorage.getItem('clipflow-openai-key')
  if (!key) throw new Error('No API key configured. Add your key in Settings > AI.')

  const savedModel = localStorage.getItem('clipflow-ai-model') || 'openai/gpt-oss-20b'
  const selectedModel = model || savedModel

  const response = await fetch('/api/repurpose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, sourceTitle, sourceDescription, sourcePlatform, targetPlatform, sourceContent, model: selectedModel }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `Request failed: ${response.status}`)
  }

  const data = await response.json()
  const raw = data.raw as string

  // Parse 3 outputs
  const outputs: RepurposeOutput[] = []
  const regex = /OUTPUT_(\d+):\s*\n([\s\S]*?)(?=---|$)/gi
  let match
  while ((match = regex.exec(raw)) !== null) {
    outputs.push({
      index: parseInt(match[1]),
      content: match[2].trim(),
    })
  }
  return outputs.sort((a, b) => a.index - b.index)
}
