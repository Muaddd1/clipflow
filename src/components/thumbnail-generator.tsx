'use client'

import { useState, useEffect } from 'react'
import { Image, Sparkles, RefreshCw, Check, X, ChevronRight, Loader2, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Platform } from '@/lib/types'

interface ThumbnailGeneratorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contentTitle?: string
  contentHook?: string
  platform?: Platform
  onAccept?: (dataUrl: string) => void
}

const aspectOptions = [
  { value: '16:9', label: 'YouTube (16:9)' },
  { value: '9:16', label: 'TikTok / Shorts (9:16)' },
  { value: '1:1',  label: 'Instagram Post (1:1)' },
  { value: '4:5',  label: 'Instagram Portrait (4:5)' },
]

const platformEmojis: Record<Platform, string> = {
  youtube: '▶️',
  tiktok: '🎵',
  instagram: '📷',
  x: '🐦',
  linkedin: '💼',
}

const stylePresets = [
  { value: 'vibrant', label: 'Vibrant & Bold', prompt: 'vibrant colors, bold text overlay, high contrast, cinematic lighting' },
  { value: 'minimal', label: 'Minimal Clean', prompt: 'minimalist design, clean typography, soft gradients, professional look' },
  { value: 'dramatic', label: 'Dramatic Dark', prompt: 'dark moody background, dramatic lighting, bold colors, cinematic feel' },
  { value: 'playful', label: 'Playful Fun', prompt: 'bright colors, fun elements, energetic composition, friendly vibe' },
  { value: 'professional', label: 'Professional Biz', prompt: 'corporate clean, professional typography, subtle gradients, trustworthy feel' },
  { value: 'custom', label: 'Custom Prompt', prompt: '' },
]

export function ThumbnailGenerator({ open, onOpenChange, contentTitle, contentHook, platform, onAccept }: ThumbnailGeneratorProps) {
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('vibrant')
  const [aspect, setAspect] = useState('16:9')
  const [generating, setGenerating] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [apiKeyInput, setApiKeyInput] = useState('')

  const hasApiKey = typeof window !== 'undefined' && !!localStorage.getItem('clipflow-replicate-key')

  const handleSaveKey = () => {
    if (!apiKeyInput.trim()) {
      toast.error('Please enter a valid API key')
      return
    }
    localStorage.setItem('clipflow-replicate-key', apiKeyInput.trim())
    // Force a re-render to update hasApiKey
    setPrompt(prev => prev)
    toast.success('API Key saved!')
  }


  // Auto-fill prompt from content title/hook
  useEffect(() => {
    if (open && contentTitle) {
      const base = contentTitle
      const hook = contentHook ? ` — ${contentHook}` : ''
      setPrompt(`Thumbnail for YouTube video: "${base}${hook}", eye-catching, professional creator thumbnail`)
    }
  }, [open, contentTitle, contentHook])

  const buildPrompt = () => {
    if (style === 'custom') return prompt
    const preset = stylePresets.find(s => s.value === style)
    const styleStr = preset?.prompt || ''
    return `${prompt}. ${styleStr}, high quality, 4K`
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error('Please enter a prompt'); return }
    setGenerating(true)
    setError(null)
    setImageUrl(null)

    try {
      const apiKey = localStorage.getItem('clipflow-replicate-key')!
      const fullPrompt = buildPrompt()

      const response = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, prompt: fullPrompt, aspectRatio: aspect }),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Generation failed')
      } else {
        setImageUrl(result.imageUrl)
      }
    } catch (err: any) {
      setError(err.message || 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const handleAccept = () => {
    if (imageUrl && onAccept) {
      onAccept(imageUrl)
    }
    toast.success('Thumbnail saved!')
    onOpenChange(false)
    setImageUrl(null)
    setPrompt('')
  }

  const handleClose = () => {
    onOpenChange(false)
    setImageUrl(null)
    setError(null)
  }

  const handleReset = () => {
    setImageUrl(null)
    setError(null)
  }

  const platformDefault = platform || 'youtube'
  const platformAspect = platformDefault === 'tiktok' || platformDefault === 'instagram' ? '9:16' : '16:9'

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wand2 size={16} className="text-violet" />
          AI Thumbnail Generator
        </DialogTitle>
      </DialogHeader>

      <DialogBody className="p-0">
        {!hasApiKey ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-violet/10 flex items-center justify-center mx-auto">
              <Image size={20} className="text-violet" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-white">Replicate API Key Required</p>
              <p className="text-xs text-white/40">Add your key to generate AI thumbnails.</p>
            </div>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <Input
                placeholder="Enter Replicate API key (r8_...)"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="text-center"
              />
              <Button variant="primary" size="sm" onClick={handleSaveKey}>
                Save & Continue
              </Button>
            </div>
            <p className="text-[10px] text-white/20">
              Your key is stored locally in your browser.
            </p>
          </div>
        ) : generating ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-full border-2 border-violet border-t-transparent animate-spin mx-auto" />
            <div>
              <p className="text-sm font-medium text-white">Generating thumbnail...</p>
              <p className="text-xs text-white/40 mt-1">This usually takes 20-40 seconds</p>
            </div>
          </div>
        ) : imageUrl ? (
          <div className="space-y-3">
            <div className="p-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-emerald" />
                <p className="text-xs text-white/50">Thumbnail generated — preview below</p>
              </div>
            </div>
            <div className="px-4">
              <div className="relative rounded-xl overflow-hidden border border-white/[0.08]">
                <img
                  src={imageUrl}
                  alt="Generated thumbnail"
                  className="w-full h-auto object-cover"
                  style={{ maxHeight: '320px', objectPosition: 'center' }}
                />
              </div>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={handleReset} className="flex-1 gap-1.5">
                  <RefreshCw size={13} /> Regenerate
                </Button>
                <Button variant="secondary" size="sm" onClick={handleClose} className="flex-1 gap-1.5">
                  <X size={13} /> Discard
                </Button>
                <Button variant="primary" size="sm" onClick={handleAccept} className="flex-1 gap-1.5">
                  <Check size={13} /> Use Thumbnail
                </Button>
              </div>
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
            <div className="flex items-center gap-2 p-3 rounded-lg bg-violet/5 border border-violet/10">
              <Sparkles size={13} className="text-violet shrink-0" />
              <p className="text-xs text-white/50">
                AI creates a thumbnail based on your description. Be specific — mention text you want, colors, mood, and any elements to include.
              </p>
            </div>

            <Textarea
              label="Thumbnail Description"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="e.g. Bold text '10X Productivity' over a focused workspace, vibrant orange and dark blue gradient, cinematic lighting..."
              rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Style"
                value={style}
                onValueChange={v => setStyle(v)}
                options={stylePresets.map(s => ({ value: s.value, label: s.label }))}
                id="thumb-style"
              />
              <Select
                label="Aspect Ratio"
                value={aspect}
                onValueChange={v => setAspect(v)}
                options={aspectOptions}
                id="thumb-aspect"
              />
            </div>

            <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
              <p className="text-xs text-white/30 mb-2 font-mono">Style presets:</p>
              <div className="flex flex-wrap gap-1.5">
                {stylePresets.filter(s => s.value !== 'custom').map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setStyle(preset.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-md text-xs border transition-colors',
                      style === preset.value
                        ? 'bg-violet/10 border-violet/30 text-violet'
                        : 'bg-white/[0.02] border-white/[0.06] text-white/40 hover:text-white/60'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogBody>

      <DialogFooter className="p-4 border-t border-white/[0.06]">
        {imageUrl ? null : (
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={handleClose}>Cancel</Button>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={!prompt.trim() || !hasApiKey || generating}
              className="gap-1.5"
            >
              <Sparkles size={14} />
              {generating ? 'Generating...' : 'Generate Thumbnail'}
            </Button>
          </div>
        )}
      </DialogFooter>
    </Dialog>
  )
}
