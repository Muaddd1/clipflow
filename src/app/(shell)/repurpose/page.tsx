'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Copy, Lightbulb, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/types'

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

type OutputCard = {
  id: string
  platform: Platform
  content: string
  label: string
}

const templateHooks = [
  "POV: You finally understand why everyone talks about this...",
  "Nobody is talking about this, but it changed everything for me",
  "I tried this for 30 days and here's what happened",
  "The uncomfortable truth about [topic] nobody tells you",
  "Stop scrolling. This is the only guide you'll need.",
  "I asked 100 people and 97 said the same thing...",
  "This feeling when it finally clicks ✨",
  "Plot twist: it was never about the [topic]",
  "Ranking these [items] was harder than I thought",
  "3 things I wish I knew before starting [topic]",
]

const tiktokConcepts = [
  "Day in the life of a creator — the unglamorous truth",
  "Reacting to my old content (cringe warning)",
  "Things I don't tell brands about my analytics",
  "POV: Your video goes viral while you're sleeping",
  "Ranking my videos by how much they actually made",
]

const xPosts = [
  "Hot take: consistency beats virality. 100 videos that got 1K views > 1 video that got 1M.",
  "The creator economy advice I wished I got 3 years ago: start before you're ready.",
  "Content is just trust in another form. Every post is a deposit or a withdrawal.",
  "Nobody wants a 'content creator.' They want someone who solves their problem entertainingly.",
  "The algorithm didn't change. Your content did. Own that.",
]

const linkedinPosts = [
  "After 2 years creating content across 4 platforms, here's what actually moves the needle:\n\n1. Ship more, perfect less\n2. Engage before you create\n3. Repurpose everything 5 times\n4. Data > opinions\n\nWhat's your biggest lesson? 👇",
]

const instagramCaptions = [
  "The content game is 10% posting and 90% obsessing over why nobody's engaging. DM me your biggest struggle 👇",
  "Create content that makes people feel something. That's the whole game. 🎯",
  "Your first 100 videos will be bad. Your next 100 will be better. Just start. ✨",
  "Consistency is the only hack that actually works. No viral secret. Just showing up. 💪",
  "If your content isn't embarrassing you, you're not being honest enough. 🙃",
]

function generateOutputs(sourceTitle: string, platform: Platform): OutputCard[] {
  const outputs: OutputCard[] = []
  if (platform === 'youtube' || platform === 'tiktok') {
    tiktokConcepts.forEach((c, i) => outputs.push({ id: `tt-${i}`, platform: 'tiktok', content: c, label: `TikTok #${i + 1}` }))
    xPosts.slice(0, 3).forEach((c, i) => outputs.push({ id: `x-${i}`, platform: 'x', content: c, label: `X Post #${i + 1}` }))
  }
  if (platform === 'x') {
    templateHooks.forEach((h, i) => outputs.push({ id: `hook-${i}`, platform: 'x', content: h, label: `Hook #${i + 1}` }))
  }
  if (platform === 'linkedin') {
    linkedinPosts.forEach((c, i) => outputs.push({ id: `li-${i}`, platform: 'linkedin', content: c, label: `LinkedIn #${i + 1}` }))
  }
  if (platform === 'instagram') {
    instagramCaptions.forEach((c, i) => outputs.push({ id: `ig-${i}`, platform: 'instagram', content: c, label: `Caption #${i + 1}` }))
  }
  // Universal outputs
  xPosts.slice(0, 2).forEach((c, i) => outputs.push({ id: `ux-${i}`, platform: 'x', content: c, label: `X Post #${i + 1}` }))
  templateHooks.slice(0, 5).forEach((h, i) => outputs.push({ id: `uh-${i}`, platform: 'x', content: h, label: `Short Hook #${i + 1}` }))
  return outputs
}

export default function RepurposePage() {
  const { data } = useData()
  const [sourceId, setSourceId] = useState('')
  const [outputs, setOutputs] = useState<OutputCard[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  const sourceContent = data.content.find(c => c.id === sourceId)

  const handleGenerate = () => {
    if (!sourceId) { toast.error('Select a piece of content first'); return }
    const content = data.content.find(c => c.id === sourceId)
    if (!content) return
    const generated = generateOutputs(content.title, content.platform as Platform)
    setOutputs(generated)
    toast.success(`Generated ${generated.length} repurposed outputs`)
  }

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(null), 2000)
  }

  const handleUpdate = (id: string, text: string) => {
    setOutputs(prev => prev.map(o => o.id === id ? { ...o, content: text } : o))
  }

  const iconForPlatform = (p: Platform) => {
    const map: Record<Platform, React.ReactNode> = {
      youtube: <span className="text-xs font-bold text-red-400">YT</span>,
      tiktok: <span className="text-[10px]">🎵</span>,
      instagram: <span className="text-[10px]">📷</span>,
      x: <X size={11} className="text-white/60" />,
      linkedin: <span className="text-[10px] font-bold text-blue-400">in</span>,
    }
    return map[p]
  }

  const grouped = outputs.reduce((acc, o) => {
    if (!acc[o.platform]) acc[o.platform] = []
    acc[o.platform].push(o)
    return acc
  }, {} as Record<Platform, OutputCard[]>)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Repurpose</h1>
        <p className="text-white/40 text-sm mt-0.5">Turn one piece of content into many across platforms</p>
      </div>

      {/* Source selector */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Select
              label="Source Content"
              value={sourceId}
              onValueChange={setSourceId}
              options={data.content.map(c => ({ value: c.id, label: c.title }))}
              placeholder="Select content to repurpose..."
              id="repurpose-source"
            />
          </div>
          <Button variant="primary" onClick={handleGenerate}><Lightbulb size={14} />Generate Outputs</Button>
        </div>
        {sourceContent && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Badge variant="platform" platform={sourceContent.platform as Platform} />
            <p className="text-sm text-white/60">{sourceContent.title}</p>
            <span className="text-xs text-white/20 ml-auto">{sourceContent.status}</span>
          </div>
        )}
      </div>

      {/* Outputs */}
      {outputs.length === 0 ? (
        <EmptyState
          icon={<FileText size={24} />}
          title="No outputs yet"
          description="Select a piece of content and click Generate to create repurposed outputs for other platforms."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([platform, cards]) => (
            <div key={platform}>
              <div className="flex items-center gap-2 mb-3">
                {iconForPlatform(platform as Platform)}
                <h3 className="text-sm font-semibold text-white/70 capitalize">{platform}</h3>
                <span className="text-xs text-white/20">{cards.length} outputs</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {cards.map(card => (
                  <div key={card.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-white/25 uppercase">{card.label}</span>
                      <button onClick={() => handleCopy(card.id, card.content)}
                        className={cn('text-xs px-2.5 py-1 rounded-md transition-all', copied === card.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/40 hover:text-white/70')}>
                        {copied === card.id ? 'Copied!' : <><Copy size={10} className="inline mr-1" />Copy</>}
                      </button>
                    </div>
                    <textarea
                      value={card.content}
                      onChange={e => handleUpdate(card.id, e.target.value)}
                      rows={3}
                      className="w-full bg-transparent text-sm text-white/70 placeholder:text-white/15 outline-none resize-none leading-relaxed"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
