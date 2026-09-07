'use client'

import { useState } from 'react'
import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { PenTool, Plus, Trash2, Save, Clock, ArrowLeft, Sparkles } from 'lucide-react'
import { formatDate, formatRelativeDate } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'
import { AiScriptGenerator } from '@/components/ai-script-generator'

export default function ScriptsPage() {
  const { data, addScript, updateScript, deleteScript } = useData()
  const [newOpen, setNewOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  const [editorId, setEditorId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [newForm, setNewForm] = useState({ title: '', hook: '', introduction: '', body: '', examples: '', cta: '', notes: '' })

  const script = editorId ? data.scripts.find(s => s.id === editorId) : null

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('new') === 'true') setNewOpen(true)
  }, [searchParams])

  const calcStats = (form: typeof newForm) => {
    const text = [form.hook, form.introduction, form.body, form.examples, form.cta].join(' ')
    return { words: text.split(/\s+/).filter(Boolean).length, chars: text.length }
  }

  const handleNew = () => {
    if (!newForm.title.trim()) { toast.error('Title is required'); return }
    addScript({ ...newForm, wordCount: calcStats(newForm).words, charCount: calcStats(newForm).chars })
    toast.success('Script created')
    setNewOpen(false)
    setNewForm({ title: '', hook: '', introduction: '', body: '', examples: '', cta: '', notes: '' })
  }

  const handleSave = () => {
    if (!script) return
    setSaving(true)
    const stats = calcStats({
      title: script.title,
      hook: script.hook, introduction: script.introduction, body: script.body,
      examples: script.examples, cta: script.cta, notes: script.notes
    })
    updateScript(script.id, { ...script, wordCount: stats.words, charCount: stats.chars })
    setLastSaved(new Date().toISOString())
    setSaving(false)
    toast.success('Script saved')
  }

  const handleDelete = () => {
    if (deleteId) { deleteScript(deleteId); toast.success('Script deleted'); setDeleteId(null); if (editorId === deleteId) setEditorId(null) }
  }

  // Script editor
  if (script) {
    const stats = calcStats(script)
    return (
      <div className="space-y-6 max-w-4xl">
        <div className="flex items-center gap-4">
          <button onClick={() => setEditorId(null)} className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft size={15} />
          </button>
          <div className="flex-1">
            <input
              value={script.title}
              onChange={e => updateScript(script.id, { ...script, title: e.target.value })}
              className="text-xl font-bold text-white bg-transparent outline-none w-full"
              placeholder="Script title..."
            />
          </div>
          <Button variant="primary" size="sm" onClick={handleSave} disabled={saving}>
            <Save size={14} />{saving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[['Words', stats.words], ['Characters', stats.chars], ['Read time', `${Math.ceil(stats.words / 200)}m`]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
              <p className="text-xs text-white/30 mb-1">{l}</p>
              <p className="text-xl font-bold text-white">{v}</p>
            </div>
          ))}
        </div>

        <div className="space-y-4">
          {[
            { key: 'hook', label: 'Hook', placeholder: 'The opening line that makes people keep watching...', value: script.hook },
            { key: 'introduction', label: 'Introduction', placeholder: 'Set up the context and hook...', value: script.introduction },
            { key: 'body', label: 'Main Content', placeholder: 'The core of your script...', value: script.body },
            { key: 'examples', label: 'Examples', placeholder: 'Supporting examples and stories...', value: script.examples },
            { key: 'cta', label: 'Call to Action', placeholder: 'What should viewers do next?...', value: script.cta },
          ].map(field => (
            <div key={field.key} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
              <label className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2 block">{field.label}</label>
              <textarea
                value={field.value}
                onChange={e => updateScript(script.id, { ...script, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                rows={field.key === 'body' ? 8 : 3}
                className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/15 outline-none resize-none leading-relaxed"
              />
            </div>
          ))}

          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <label className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2 block">Notes</label>
            <textarea
              value={script.notes}
              onChange={e => updateScript(script.id, { ...script, notes: e.target.value })}
              placeholder="Personal notes, reminders, pacing notes..."
              rows={2}
              className="w-full bg-transparent text-sm text-white/40 placeholder:text-white/15 outline-none resize-none"
            />
          </div>
        </div>

        {lastSaved && <p className="text-xs text-white/20 flex items-center gap-1"><Clock size={10} />Saved {formatRelativeDate(lastSaved)}</p>}

        <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete script?" description="This will permanently delete this script." confirmLabel="Delete" destructive onConfirm={handleDelete} />
      </div>
    )
  }

  // Scripts list
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Script Studio</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.scripts.length} scripts</p>
        </div>
        <Button variant="secondary" onClick={() => setAiOpen(true)}><Sparkles size={14} />AI Generate</Button>
        <Button variant="primary" onClick={() => setNewOpen(true)}><Plus size={14} />New Script</Button>
      </div>

      {data.scripts.length === 0 ? (
        <EmptyState icon={<PenTool size={24} />} title="No scripts yet" description="Create your first script to start writing." action={<Button variant="primary" onClick={() => setNewOpen(true)}><Plus size={14} />New Script</Button>} />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {data.scripts.map(s => (
            <div key={s.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors group cursor-pointer" onClick={() => setEditorId(s.id)}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white/90 group-hover:text-white">{s.title}</h3>
                <button onClick={e => { e.stopPropagation(); setDeleteId(s.id) }} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              {s.hook && <p className="text-xs text-violet/80 mb-3 line-clamp-2">"{s.hook}"</p>}
              <div className="flex items-center gap-4 text-xs text-white/25">
                <span>{s.wordCount} words</span>
                <span>{Math.ceil(s.wordCount / 200)}m read</span>
                <span>Updated {formatRelativeDate(s.updatedAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogHeader><DialogTitle>New Script</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Title" value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="Script title..." />
          <Input label="Hook" value={newForm.hook} onChange={e => setNewForm(p => ({ ...p, hook: e.target.value }))} placeholder="Opening hook..." />
          <Textarea label="Introduction" value={newForm.introduction} onChange={e => setNewForm(p => ({ ...p, introduction: e.target.value }))} rows={2} placeholder="Introduction..." />
          <Textarea label="Body" value={newForm.body} onChange={e => setNewForm(p => ({ ...p, body: e.target.value }))} rows={4} placeholder="Main content..." />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setNewOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleNew}>Create Script</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete script?" description="This will permanently delete this script." confirmLabel="Delete" destructive onConfirm={handleDelete} />

      <AiScriptGenerator
        open={aiOpen}
        onOpenChange={setAiOpen}
        onSave={(scriptData) => {
          addScript(scriptData)
          setAiOpen(false)
        }}
      />
    </div>
  )
}
