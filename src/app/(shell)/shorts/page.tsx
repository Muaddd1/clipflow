'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Clapperboard, Sparkles, Download, Save, RefreshCw, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { generateShortsScript, generateShortsImage, generateShortsNarration } from '@/lib/ai'
import { renderShortsVideo, type ShortsSceneAsset } from '@/lib/shorts-video'
import type { Platform } from '@/lib/types'

const platformOptions = [
  { value: 'youtube', label: 'YouTube Shorts' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram Reels' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const toneOptions = [
  { value: 'Casual', label: 'Casual & Friendly' },
  { value: 'Professional', label: 'Professional' },
  { value: 'Provocative', label: 'Provocative / Edgy' },
  { value: 'Educational', label: 'Educational' },
  { value: 'Entertaining', label: 'Entertaining / Fun' },
]

// The free TTS endpoint only has one voice per accent (not distinct named
// voices) — these three are the accents confirmed to actually sound different.
const accentOptions = [
  { value: 'en', label: 'Default (US/UK)' },
  { value: 'en-AU', label: 'Australian' },
  { value: 'en-IN', label: 'Indian' },
]

const sceneCountOptions = [
  { value: '4', label: '4 scenes (~20s)' },
  { value: '5', label: '5 scenes (~25s)' },
  { value: '6', label: '6 scenes (~30s)' },
  { value: '7', label: '7 scenes (~40s)' },
  { value: '8', label: '8 scenes (~45s)' },
]

interface EditableScene {
  narration: string
  visual: string
  imageUrl?: string
  audioUrl?: string
}

export default function ShortsPage() {
  const { addLibraryItem } = useData()
  const hasApiKey = typeof window !== 'undefined' && !!localStorage.getItem('clipflow-groq-key')

  const [topic, setTopic] = useState('')
  const [platform, setPlatform] = useState<Platform>('youtube')
  const [tone, setTone] = useState('Casual')
  const [accent, setAccent] = useState('en')
  const [sceneCount, setSceneCount] = useState('6')

  const [titles, setTitles] = useState<string[]>([])
  const [scenes, setScenes] = useState<EditableScene[]>([])
  const [generatingScript, setGeneratingScript] = useState(false)

  const [assembling, setAssembling] = useState(false)
  const [stage, setStage] = useState('')
  const [progress, setProgress] = useState(0)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const resetOutputs = () => {
    setVideoBlob(null)
    if (videoUrl) URL.revokeObjectURL(videoUrl)
    setVideoUrl(null)
    setError(null)
    setProgress(0)
    setStage('')
  }

  const handleGenerateScript = async () => {
    if (!topic.trim()) { toast.error('Enter a topic first'); return }
    if (!hasApiKey) { toast.error('Add your Groq API key in Settings first'); return }

    setGeneratingScript(true)
    resetOutputs()
    setScenes([])
    setTitles([])

    try {
      const result = await generateShortsScript(topic, platform, tone, Number(sceneCount))
      if (!result.scenes.length) throw new Error('The AI did not return any usable scenes — try again')
      setTitles(result.titles)
      setScenes(result.scenes.map(s => ({ narration: s.narration, visual: s.visual })))
      toast.success(`Generated a ${result.scenes.length}-scene shorts script`)
    } catch (err: any) {
      toast.error(err.message || 'Script generation failed')
    } finally {
      setGeneratingScript(false)
    }
  }

  const updateScene = (i: number, field: 'narration' | 'visual', value: string) => {
    setScenes(prev => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)))
  }

  const removeScene = (i: number) => {
    setScenes(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleAssemble = async () => {
    if (scenes.length < 2) { toast.error('Keep at least 2 scenes'); return }

    setAssembling(true)
    resetOutputs()

    try {
      const assets: ShortsSceneAsset[] = []

      for (let i = 0; i < scenes.length; i++) {
        const scene = scenes[i]

        setStage(`Generating visuals ${i + 1}/${scenes.length}...`)
        const imageUrl = await generateShortsImage(scene.visual)

        setStage(`Generating narration ${i + 1}/${scenes.length}...`)
        const audioUrl = await generateShortsNarration(scene.narration, accent)

        assets.push({ narration: scene.narration, imageUrl, audioUrl })
        setProgress((i + 1) / scenes.length * 0.5)
      }

      setStage('Rendering video...')
      const blob = await renderShortsVideo(assets, {
        onProgress: pct => setProgress(0.5 + pct * 0.5),
      })

      setVideoBlob(blob)
      setVideoUrl(URL.createObjectURL(blob))
      setStage('')
      toast.success('Short generated!')
    } catch (err: any) {
      setError(err.message || 'Video generation failed')
      toast.error(err.message || 'Video generation failed')
    } finally {
      setAssembling(false)
    }
  }

  const handleDownload = () => {
    if (!videoUrl) return
    const a = document.createElement('a')
    a.href = videoUrl
    a.download = `clipflow-short-${Date.now()}.webm`
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  const handleSaveToLibrary = () => {
    if (!videoBlob) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        addLibraryItem({
          name: `${titles[0] || topic || 'AI Short'}.webm`,
          type: 'video',
          size: videoBlob.size,
          url: reader.result as string,
          category: 'Shorts',
        })
        toast.success('Saved to Library')
      } catch {
        toast.error('Could not save to Library (file may be too large) — use Download instead')
      }
    }
    reader.onerror = () => toast.error('Could not read video for saving — use Download instead')
    reader.readAsDataURL(videoBlob)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Shorts</h1>
        <p className="text-white/40 text-sm mt-0.5">
          Generate a free, faceless short — AI script, AI visuals, AI narration, assembled into a real video, all in your browser.
        </p>
      </div>

      {!hasApiKey && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <Sparkles size={14} className="text-amber-400" />
          <p className="text-xs text-amber-400/80">Add your Groq API key in Settings to enable AI Shorts.</p>
          <Button variant="secondary" size="sm" onClick={() => window.location.href = '/settings'} className="ml-auto">Go to Settings</Button>
        </div>
      )}

      {/* Config */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <Textarea
          label="Topic"
          value={topic}
          onChange={e => setTopic(e.target.value)}
          placeholder="e.g. 3 morning habits that changed my life"
          rows={2}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Select label="Platform" value={platform} onValueChange={v => setPlatform(v as Platform)} options={platformOptions} id="shorts-platform" />
          <Select label="Tone" value={tone} onValueChange={setTone} options={toneOptions} id="shorts-tone" />
          <Select label="Accent" value={accent} onValueChange={setAccent} options={accentOptions} id="shorts-accent" />
          <Select label="Length" value={sceneCount} onValueChange={setSceneCount} options={sceneCountOptions} id="shorts-scenes" />
        </div>
        <Button
          variant="primary"
          onClick={handleGenerateScript}
          disabled={!topic.trim() || !hasApiKey || generatingScript}
        >
          {generatingScript ? (
            <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />Writing script...</>
          ) : (
            <><Sparkles size={14} />Generate Script</>
          )}
        </Button>
      </div>

      {scenes.length === 0 && !generatingScript && (
        <EmptyState
          icon={<Clapperboard size={24} />}
          title="No shorts yet"
          description="Enter a topic above and generate a script — you'll get editable scenes, then a one-click button to turn them into a real video."
        />
      )}

      {/* Scenes */}
      {scenes.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white/70">Scenes ({scenes.length})</h3>
            <Button variant="secondary" size="sm" onClick={handleGenerateScript} disabled={generatingScript}>
              <RefreshCw size={12} className={generatingScript ? 'animate-spin' : ''} /> Regenerate
            </Button>
          </div>

          <div className="space-y-3">
            {scenes.map((scene, i) => (
              <div key={i} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-white/25 uppercase">Scene {i + 1}</span>
                  <button onClick={() => removeScene(i)} className="text-white/20 hover:text-red-400" title="Remove scene">
                    <Trash2 size={12} />
                  </button>
                </div>
                <textarea
                  value={scene.narration}
                  onChange={e => updateScene(i, 'narration', e.target.value)}
                  rows={2}
                  placeholder="Narration (spoken line)"
                  className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed"
                />
                <textarea
                  value={scene.visual}
                  onChange={e => updateScene(i, 'visual', e.target.value)}
                  rows={1}
                  placeholder="Visual description (for AI image)"
                  className="w-full bg-transparent text-xs text-white/40 placeholder:text-white/15 outline-none resize-none leading-relaxed font-mono"
                />
              </div>
            ))}
          </div>

          <Button variant="primary" onClick={handleAssemble} disabled={assembling || scenes.length < 2} className="w-full">
            {assembling ? (
              <><div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />{stage || 'Working...'}</>
            ) : (
              <><Clapperboard size={14} />Generate Video (free)</>
            )}
          </Button>

          {assembling && (
            <div className="space-y-1.5">
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-violet transition-all duration-200" style={{ width: `${Math.round(progress * 100)}%` }} />
              </div>
              <p className="text-[10px] text-white/30 text-center">
                This renders in real time — a {sceneCountOptions.find(o => o.value === sceneCount)?.label.match(/~(.+)\)/)?.[1] || '30s'} video takes about that long to produce.
              </p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5 text-center">
          <p className="text-sm text-red-400 mb-3">{error}</p>
          <Button variant="secondary" size="sm" onClick={() => setError(null)}>Dismiss</Button>
        </div>
      )}

      {/* Result */}
      {videoUrl && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
          <h3 className="text-sm font-semibold text-white/70">Your Short</h3>
          <div className="flex justify-center">
            <video
              controls
              src={videoUrl}
              className="rounded-lg border border-white/[0.08] max-h-[70vh]"
              style={{ aspectRatio: '9/16' }}
            />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="primary" onClick={handleDownload}><Download size={14} />Download Video</Button>
            <Button variant="secondary" onClick={handleSaveToLibrary}><Save size={14} />Save to Library</Button>
            <Button variant="ghost" onClick={resetOutputs}><X size={14} />Start Over</Button>
          </div>
          <p className="text-[10px] text-white/20 text-center">
            Videos are large — Download is the reliable way to keep this file; Library storage has a size limit.
          </p>
        </div>
      )}
    </div>
  )
}
