'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Sparkles, Copy, Lightbulb, FileText, X, RefreshCw, Check, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { repurposeContent } from '@/lib/ai'
import type { Platform } from '@/lib/types'

const targetPlatforms = [
  { value: 'tiktok', label: 'TikTok' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'youtube', label: 'YouTube' },
]

type OutputCard = {
  id: string
  platform: Platform
  content: string
  label: string
  loading?: boolean
}

export default function RepurposePage() {
  const { data } = useData()
  const [sourceId, setSourceId] = useState('')
  const [targetPlatform, setTargetPlatform] = useState<Platform>('tiktok')
  const [outputs, setOutputs] = useState<OutputCard[]>([])
  const [copied, setCopied] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const hasApiKey = typeof window !== 'undefined' && !!localStorage.getItem('clipflow-groq-key')

  const sourceContent = data.content.find(c => c.id === sourceId)
  const sourceScripts = sourceId ? data.scripts.filter(s => s.contentId === sourceId) : []

  const handleGenerate = async () => {
    if (!sourceId) { toast.error('Select a piece of content first'); return }
    if (!hasApiKey) { toast.error('Add your API key in Settings first'); return }
    const content = data.content.find(c => c.id === sourceId)
    if (!content) return

    setGenerating(true)
    setError(null)
    setOutputs([])

    try {
      const script = sourceScripts[0]
      const results = await repurposeContent(
        content.title,
        content.description || '',
        content.platform,
        targetPlatform,
        script ? `${script.introduction}\n\n${script.body}` : undefined
      )

      const newOutputs: OutputCard[] = results.map((r, i) => ({
        id: `${targetPlatform}-${Date.now()}-${i}`,
        platform: targetPlatform as Platform,
        content: r.content,
        label: `Variation ${i + 1}`,
      }))

      setOutputs(newOutputs)
      toast.success(`Generated ${newOutputs.length} AI repurposed outputs`)
    } catch (err: any) {
      setError(err.message || 'Generation failed')
      toast.error(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
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

  const handleGenerateMore = async () => {
    if (!sourceId || !hasApiKey) return
    const content = data.content.find(c => c.id === sourceId)
    if (!content) return

    setGenerating(true)
    setError(null)

    try {
      const script = sourceScripts[0]
      const results = await repurposeContent(
        content.title,
        content.description || '',
        content.platform,
        targetPlatform,
        script ? `${script.introduction}\n\n${script.body}` : undefined
      )

      const newOutputs: OutputCard[] = results.map((r, i) => ({
        id: `${targetPlatform}-${Date.now()}-${i}-more`,
        platform: targetPlatform as Platform,
        content: r.content,
        label: `Variation ${outputs.length + i + 1}`,
      }))

      setOutputs(prev => [...prev, ...newOutputs])
      toast.success(`Generated ${newOutputs.length} more outputs`)
    } catch (err: any) {
      toast.error(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
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
        <p className="text-white/40 text-sm mt-0.5">Turn one piece of content into many using AI</p>
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
          <div className="w-48">
            <Select
              label="Adapt for"
              value={targetPlatform}
              onValueChange={v => { setTargetPlatform(v as Platform); setOutputs([]) }}
              options={targetPlatforms}
              id="repurpose-target"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleGenerate}
            disabled={!sourceId || !hasApiKey || generating}
          >
            {generating ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Generating...</>
            ) : (
              <><Sparkles size={14} />AI Repurpose</>
            )}
          </Button>
        </div>

        {!hasApiKey && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
            <Sparkles size={14} className="text-amber-400" />
            <p className="text-xs text-amber-400/80">Add your Groq API key in Settings to enable AI repurposing.</p>
            <Button variant="secondary" size="sm" onClick={() => window.location.href = '/settings'} className="ml-auto">Go to Settings</Button>
          </div>
        )}

        {sourceContent && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <Badge variant="platform" platform={sourceContent.platform as Platform} />
            <p className="text-sm text-white/60">{sourceContent.title}</p>
            <span className="text-xs text-white/20 ml-auto capitalize">{sourceContent.status}</span>
          </div>
        )}
      </div>

      {/* Outputs */}
      {outputs.length === 0 && !generating && !error && (
        <EmptyState
          icon={<FileText size={24} />}
          title="No outputs yet"
          description="Select content and click AI Repurpose to generate platform-native variations using AI."
        />
      )}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5 text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {outputs.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([platform, cards]) => (
            <div key={platform}>
              <div className="flex items-center gap-2 mb-3">
                {iconForPlatform(platform as Platform)}
                <h3 className="text-sm font-semibold text-white/70 capitalize">{platform}</h3>
                <span className="text-xs text-white/20">{cards.length} outputs</span>
                <div className="ml-auto">
                  <Button variant="secondary" size="sm" onClick={handleGenerateMore} disabled={generating}>
                    <RefreshCw size={12} className={generating ? 'animate-spin' : ''} /> More
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                {cards.map(card => (
                  <div key={card.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono text-white/25 uppercase">{card.label}</span>
                      <button onClick={() => handleCopy(card.id, card.content)}
                        className={cn('text-xs px-2.5 py-1 rounded-md transition-all', copied === card.id ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/[0.04] text-white/40 hover:text-white/70')}>
                        {copied === card.id ? <><Check size={10} className="inline mr-1" />Copied</> : <><Copy size={10} className="inline mr-1" />Copy</>}
                      </button>
                    </div>
                    <textarea
                      value={card.content}
                      onChange={e => handleUpdate(card.id, e.target.value)}
                      rows={4}
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
