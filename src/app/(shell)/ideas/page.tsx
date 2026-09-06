'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Lightbulb, Plus, Trash2, Filter, Zap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Idea, IdeaStatus, Platform, Priority } from '@/lib/types'
import { toast } from 'sonner'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'idea', label: 'Idea' },
  { value: 'developing', label: 'Developing' },
  { value: 'ready_to_script', label: 'Ready to Script' },
  { value: 'recording', label: 'Recording' },
  { value: 'editing', label: 'Editing' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

const priorityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const defaultForm = {
  title: '', hook: '', description: '', platform: 'youtube' as Platform,
  category: 'Tech', tags: '', viralScore: 5, status: 'idea' as IdeaStatus, priority: 'medium' as Priority, notes: '',
}

export default function IdeasPage() {
  const { data, addIdea, updateIdea, deleteIdea } = useData()
  const searchParams = useSearchParams()
  const showNew = searchParams.get('new') === 'true'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [dialogOpen, setDialogOpen] = useState(showNew)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  const detail = detailId ? data.ideas.find(i => i.id === detailId) : null

  const filtered = data.ideas.filter(i => {
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && i.status !== statusFilter) return false
    if (priorityFilter && i.priority !== priorityFilter) return false
    return true
  })

  const handleAdd = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    addIdea({ ...form, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean) })
    toast.success('Idea added')
    setDialogOpen(false)
    setForm(defaultForm)
  }

  const handleDelete = () => {
    if (deleteId) { deleteIdea(deleteId); toast.success('Idea deleted'); setDeleteId(null) }
  }

  const ViralBar = ({ score }: { score: number }) => (
    <div className="flex items-center gap-1.5">
      <Zap size={10} className={score >= 7 ? 'text-amber-400' : 'text-white/20'} />
      <div className="w-16 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full" style={{
          width: `${score * 10}%`,
          background: score >= 8 ? '#22c55e' : score >= 5 ? '#f59e0b' : '#6b7280'
        }} />
      </div>
      <span className="text-[10px] font-mono text-white/30">{score}/10</span>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Idea Vault</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.ideas.length} ideas · {data.ideas.filter(i => i.status === 'idea').length} ready to develop</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}>
          <Plus size={14} />New Idea
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Lightbulb size={14} className="text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ideas..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter} options={statusOptions} placeholder="Status" className="w-40" id="status-filter" />
        <Select value={priorityFilter} onValueChange={setPriorityFilter} options={[{value:'',label:'All Priority'},{value:'high',label:'High'},{value:'medium',label:'Medium'},{value:'low',label:'Low'}]} placeholder="Priority" className="w-32" id="priority-filter" />
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
          {[['grid','Grid'],['list','List']].map(([v,label]) => (
            <button key={v} onClick={() => setView(v as any)} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', view === v ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/60')}>{label}</button>
          ))}
        </div>
      </div>

      {/* Ideas */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Lightbulb size={24} />} title="No ideas yet" description="Capture your first content idea to get started." action={<Button variant="primary" onClick={() => setDialogOpen(true)}><Plus size={14} />New Idea</Button>} />
      ) : view === 'grid' ? (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(idea => (
            <div key={idea.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 hover:bg-white/[0.04] transition-colors cursor-pointer group" onClick={() => setDetailId(idea.id)}>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-sm font-semibold text-white/90 group-hover:text-white line-clamp-2">{idea.title}</h3>
                <button onClick={e => { e.stopPropagation(); setDeleteId(idea.id) }} className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
              {idea.hook && <p className="text-xs text-violet font-medium mb-3 line-clamp-2">"{idea.hook}"</p>}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge variant="platform" platform={idea.platform} />
                <Badge variant="status" status={idea.status} />
                <Badge variant="priority" priority={idea.priority} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-white/20">{formatDate(idea.createdAt)}</span>
                <ViralBar score={idea.viralScore} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-4 py-3 text-[10px] font-mono text-white/20 uppercase tracking-wider">Idea</th>
                <th className="px-4 py-3 text-[10px] font-mono text-white/20 uppercase tracking-wider">Platform</th>
                <th className="px-4 py-3 text-[10px] font-mono text-white/20 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-[10px] font-mono text-white/20 uppercase tracking-wider">Viral</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(idea => (
                <tr key={idea.id} onClick={() => setDetailId(idea.id)} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <td className="px-4 py-3"><p className="text-sm text-white/80 font-medium">{idea.title}</p><p className="text-xs text-white/30 truncate max-w-xs">{idea.hook}</p></td>
                  <td className="px-4 py-3"><Badge variant="platform" platform={idea.platform} /></td>
                  <td className="px-4 py-3"><Badge variant="status" status={idea.status} /></td>
                  <td className="px-4 py-3"><ViralBar score={idea.viralScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Panel */}
      {detail && (
        <Dialog open={!!detailId} onOpenChange={v => !v && setDetailId(null)}>
          <DialogBody className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">{detail.title}</h2>
            {detail.hook && <p className="text-sm text-violet font-medium">"{detail.hook}"</p>}
            {detail.description && <p className="text-sm text-white/50">{detail.description}</p>}
            <div className="flex flex-wrap gap-2"><Badge variant="platform" platform={detail.platform} /><Badge variant="status" status={detail.status} /><Badge variant="priority" priority={detail.priority} /></div>
            {detail.notes && <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]"><p className="text-xs text-white/30 mb-1">Notes</p><p className="text-sm text-white/60">{detail.notes}</p></div>}
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/20">Created {formatDate(detail.createdAt)}</span>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteId(detail.id); setDetailId(null) }}><Trash2 size={14} />Delete</Button>
            </div>
          </DialogBody>
        </Dialog>
      )}

      {/* New Idea Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader><DialogTitle>New Idea</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Title" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="The content idea..." />
          <Input label="Hook" value={form.hook} onChange={e => setForm(p => ({ ...p, hook: e.target.value }))} placeholder="The hook — what makes people stop scrolling?" />
          <Textarea label="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description or outline..." rows={2} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Platform" value={form.platform} onValueChange={v => setForm(p => ({ ...p, platform: v as Platform }))} options={platformOptions} id="idea-platform" />
            <Select label="Priority" value={form.priority} onValueChange={v => setForm(p => ({ ...p, priority: v as Priority }))} options={priorityOptions} id="idea-priority" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Status" value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as IdeaStatus }))} options={statusOptions.slice(1)} id="idea-status" />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Viral Score</label>
              <input type="range" min={1} max={10} value={form.viralScore} onChange={e => setForm(p => ({ ...p, viralScore: +e.target.value }))} className="w-full accent-violet" />
              <div className="flex justify-between"><span className="text-xs text-white/20">1</span><span className="text-xs font-mono text-violet">{form.viralScore}/10</span><span className="text-xs text-white/20">10</span></div>
            </div>
          </div>
          <Input label="Tags" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="AI, Tech, Tutorial (comma separated)" />
          <Textarea label="Notes" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Additional notes..." rows={2} />
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Idea</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete idea?" description="This will permanently delete this idea." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  )
}
