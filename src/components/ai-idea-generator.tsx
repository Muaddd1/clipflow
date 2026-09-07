'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Copy, Check, RefreshCw, Save, X, ChevronRight, TrendingUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { generateIdeas, parseIdeasOutput, type ParsedIdea } from '@/lib/ai'
import type { Platform } from '@/lib/types'

interface AiIdeaGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaveIdeas?: (ideas: Array<{
    title: string
    hook: string
    description: string
    platform: Platform
    category: string
    tags: string[]
    viralScore: number
    status: 'idea'
    priority: 'medium' | 'high' | 'low'
    notes: string
  }>) => void
}

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const categoryOptions = [
  { value: 'Tech', label: 'Tech' },
  { value: 'Education', label: 'Education' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Business', label: 'Business' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Music', label: 'Music' },
  { value: 'Sports', label: 'Sports' },
  { value: 'News', label: 'News' },
  { value: 'Other', label: 'Other' },
]

const countOptions = [
  { value: '3', label: '3 ideas' },
  { value: '5', label: '5 ideas' },
  { value: '8', label: '8 ideas' },
  { value: '10', label: '10 ideas' },
]

export function AiIdeaGenerator({ open, onOpenChange, onSaveIdeas }: AiIdeaGeneratorProps) {
  const [niche, setNiche] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [category, setCategory] = useState('Tech')
  const [count, setCount] = useState('5')
  const [generating, setGenerating] = useState(false)
  const [ideas, setIdeas] = useState<ParsedIdea[]>([])
  const [selectedIdeas, setSelectedIdeas] = useState<Set<number>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)

  const hasApiKey = typeof window !== 'undefined' && !!localStorage.getItem('clipflow-groq-key')

  useEffect(() => {
    if (open) {
      setNiche('')
      setPlatform('youtube')
      setCategory('Tech')
      setCount('5')
      setIdeas([])
      setSelectedIdeas(new Set())
      setError(null)
    }
  }, [open])

  const handleGenerate = async () => {
    if (!niche.trim()) { toast.error('Please enter a niche or topic'); return }
    setGenerating(true)
    setError(null)
    setIdeas([])
    setSelectedIdeas(new Set())
    try {
      const result = await generateIdeas(niche, platform, category, parseInt(count), undefined)
      if (!result || result.length === 0) {
        setError('No ideas returned. Try a different topic or check your API key in Settings.')
      } else {
        setIdeas(result)
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed. Check your API key in Settings.')
    } finally {
      setGenerating(false)
    }
  }

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    toast.success('Copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  const toggleIdea = (index: number) => {
    const next = new Set(selectedIdeas)
    if (next.has(index)) next.delete(index)
    else next.add(index)
    setSelectedIdeas(next)
  }

  const handleSave = () => {
    if (!onSaveIdeas || selectedIdeas.size === 0) return
    const toSave = Array.from(selectedIdeas).map(i => ideas[i])
    const mapped = toSave.map(idea => ({
      title: idea.title,
      hook: idea.hook,
      description: `${idea.hook}\n\nAngle: ${idea.angle}`,
      platform,
      category,
      tags: [idea.trending ? 'trending' : '', idea.viralPotential.toLowerCase()].filter(Boolean),
      viralScore: idea.viralPotential === 'High' ? 9 : idea.viralPotential === 'Medium' ? 6 : 3,
      status: 'idea' as const,
      priority: idea.viralPotential === 'High' ? 'high' as const : idea.viralPotential === 'Medium' ? 'medium' as const : 'low' as const,
      notes: `[AI Generated]\nPlatform: ${platform}\nTopic: ${idea.topic}\nTrending: ${idea.trending ? 'Yes' : 'No'}\nDifficulty: ${idea.difficulty}`,
    }))
    onSaveIdeas(mapped)
    toast.success(`Saved ${mapped.length} idea${mapped.length > 1 ? 's' : ''} to vault`)
    onOpenChange(false)
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const viralColor = (vp: string) => vp === 'High' ? 'text-emerald' : vp === 'Medium' ? 'text-amber' : 'text-white/40'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles size={16} className="text-violet" />
          AI Idea Generator
        </DialogTitle>
      </DialogHeader>
      <DialogBody className="p-0">
        {!hasApiKey ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-violet/10 flex items-center justify-center mx-auto">
              <Sparkles size={20} className="text-violet" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">API Key Required</p>
              <p className="text-xs text-white/40 mt-1">Add your Groq API key in Settings to use AI generation.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => { handleClose(); window.location.href = '/settings' }}>
              Go to Settings <ChevronRight size={14} />
            </Button>
          </div>
        ) : generating ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-violet border-t-transparent animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium text-white">Generating ideas...</p>
              <p className="text-xs text-white/40 mt-1">This usually takes 5-10 seconds</p>
            </div>
          </div>
        ) : ideas.length > 0 ? (
          <div className="max-h-[60vh] overflow-y-auto">
            <div className="p-4 border-b border-white/[0.06]">
              <p className="text-xs text-white/40">
                {ideas.length} ideas generated — click to select, then Save to add to vault
              </p>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {ideas.map((idea, i) => (
                <div
                  key={i}
                  onClick={() => toggleIdea(i)}
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    selectedIdeas.has(i) ? 'bg-violet/5' : 'hover:bg-white/[0.02]'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5',
                      selectedIdeas.has(i) ? 'bg-violet border-violet' : 'border-white/20'
                    )}>
                      {selectedIdeas.has(i) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h4 className="text-sm font-medium text-white">{idea.title}</h4>
                        {idea.trending && (
                          <Badge variant="default" className="text-[9px] bg-emerald/10 text-emerald border-0 gap-1">
                            <TrendingUp size={8} /> Trending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50 mb-2">{idea.hook}</p>
                      <div className="flex items-center gap-3 text-[10px] font-mono">
                        <span className={viralColor(idea.viralPotential)}>
                          {idea.viralPotential} viral
                        </span>
                        <span className="text-white/20">{idea.difficulty}</span>
                        <span className="text-white/20">·</span>
                        <span className="text-white/30">{idea.topic}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleCopy(idea.raw, `idea-${i}`) }}
                      className="text-white/20 hover:text-white/60 p-1"
                    >
                      {copied === `idea-${i}` ? <Check size={12} className="text-emerald" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <X size={20} className="text-red-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Generation Failed</p>
              <p className="text-xs text-white/40 mt-1">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setError(null)}>
              <RefreshCw size={14} /> Try Again
            </Button>
          </div>
        ) : (
          <div className="p-5 space-y-4">
            <Textarea
              label="Niche / Topic"
              value={niche}
              onChange={e => setNiche(e.target.value)}
              placeholder="e.g. Productivity tips for remote workers, or AI tools for small businesses..."
              rows={3}
            />
            <div className="grid grid-cols-2 gap-3">
              <Select label="Platform" value={platform} onValueChange={v => setPlatform(v as Platform)} options={platformOptions} id="idea-platform" />
              <Select label="Category" value={category} onValueChange={setCategory} options={categoryOptions} id="idea-category" />
            </div>
            <Select
              label="Number of Ideas"
              value={count}
              onValueChange={setCount}
              options={countOptions}
              id="idea-count"
            />
            <div className="rounded-xl border border-violet/10 bg-violet/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap size={12} className="text-violet" />
                <p className="text-xs font-medium text-white/70">Tip</p>
              </div>
              <p className="text-xs text-white/40">Be specific with your niche for better results. "Productivity for remote developers" works better than just "productivity".</p>
            </div>
          </div>
        )}
      </DialogBody>

      <DialogFooter className="p-4 border-t border-white/[0.06]">
        {ideas.length > 0 ? (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setIdeas([]); setSelectedIdeas(new Set()) }}>
              <RefreshCw size={14} /> Generate More
            </Button>
            <Button variant="secondary" size="sm" onClick={() => handleCopy(ideas.map(i => i.raw).join('\n\n'), 'all')}>
              <Copy size={14} /> Copy All
            </Button>
            <div className="flex-1" />
            <Button variant="primary" size="sm" onClick={handleSave} disabled={selectedIdeas.size === 0}>
              <Save size={14} /> Save {selectedIdeas.size > 0 ? `(${selectedIdeas.size})` : ''} to Vault
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button variant="primary" onClick={handleGenerate} disabled={!niche.trim() || !hasApiKey}>
              <Sparkles size={14} /> Generate Ideas
            </Button>
          </div>
        )}
      </DialogFooter>
    </Dialog>
  )
}
