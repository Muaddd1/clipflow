'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import {
  Plus, Search, Filter, FileVideo, ExternalLink,
  Trash2, Edit, ThumbsUp, MessageCircle, Share2, Eye, Wand2,
} from 'lucide-react'
import { ThumbnailUpload } from '@/components/thumbnail-upload'
import { ThumbnailGenerator } from '@/components/thumbnail-generator'
import { formatNumber, formatDate, statusLabel, platformLabel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Content, ContentStatus, Platform } from '@/lib/types'
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

const platformOptions = [
  { value: '', label: 'All Platforms' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X' },
  { value: 'linkedin', label: 'LinkedIn' },
]

// Collect all unique tags from content
function getAllContentTags(data: any): string[] {
  const tags = new Set<string>()
  data.content.forEach((c: any) => c.tags?.forEach((t: string) => tags.add(t)))
  return Array.from(tags).sort()
}

function ContentRow({ content, onDelete, selected, onToggle }: { content: Content; onDelete: (id: string) => void; selected: boolean; onToggle: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-2 sm:gap-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors px-4 -mx-4">
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(content.id)}
          onClick={e => e.stopPropagation()}
          className="w-3.5 h-3.5 accent-violet cursor-pointer shrink-0"
        />
        {/* Info */}
        <Link href={`/content/${content.id}`} className="flex items-center gap-3 min-w-0">
          {content.thumbnail && (
            <img src={content.thumbnail} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0 hidden sm:block" />
          )}
          {!content.thumbnail && (
            <div className="w-14 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 hidden sm:block">
              <FileVideo size={14} className="text-white/20" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="text-sm font-medium text-white/90 truncate">{content.title}</p>
              <Badge variant="platform" platform={content.platform} />
              <Badge variant="status" status={content.status} />
            </div>
            <p className="text-xs text-white/30">
              {content.status === 'published' && content.publishedAt ? formatDate(content.publishedAt) : content.scheduledAt ? `Scheduled ${formatDate(content.scheduledAt)}` : formatDate(content.createdAt)}
            </p>
          </div>
        </Link>

        {/* Platform */}
        <div className="hidden sm:block"><Badge variant="platform" platform={content.platform} /></div>

        {/* Status */}
        <div className="hidden sm:block"><Badge variant="status" status={content.status} /></div>

        {/* Stats - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-3 text-xs text-white/30">
          <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(content.views)}</span>
          <span className="flex items-center gap-1"><ThumbsUp size={12} />{formatNumber(content.likes)}</span>
        </div>

        {/* Engagement - hidden on mobile */}
        <div className="hidden sm:block text-right">
          <p className="text-sm font-mono text-white/60">{content.engagementRate > 0 ? `${content.engagementRate}%` : '—'}</p>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete content?"
        description="This action cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={() => onDelete(content.id)}
      />
    </>
  )
}

export default function ContentPage() {
  const { data, addContent, deleteContent, deleteManyContent, updateManyContent, updateContent } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()
  const showNew = searchParams.get('new') === 'true'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [showNewDialog, setShowNewDialog] = useState(showNew)
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    platform: 'youtube' as Platform,
    status: 'idea' as ContentStatus,
    thumbnail: '',
  })
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkStatus, setBulkStatus] = useState<ContentStatus>('idea')
  const [generateOpen, setGenerateOpen] = useState(false)

  const allTags = getAllContentTags(data)

  const filtered = data.content.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && c.status !== statusFilter) return false
    if (platformFilter && c.platform !== platformFilter) return false
    if (tagFilter && !c.tags?.includes(tagFilter)) return false
    return true
  })

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }
  const toggleAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(c => c.id))
    }
  }
  const handleBulkDelete = () => {
    deleteManyContent(selectedIds)
    toast.success(`${selectedIds.length} items deleted`)
    setSelectedIds([])
    setBulkOpen(false)
  }
  const handleBulkStatus = () => {
    selectedIds.forEach(id => updateContent(id, { status: bulkStatus }))
    toast.success(`${selectedIds.length} items updated`)
    setSelectedIds([])
    setBulkOpen(false)
  }

  const handleAdd = () => {
    if (!newForm.title.trim()) {
      toast.error('Title is required')
      return
    }
    addContent({
      ...newForm,
      views: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      engagementRate: 0,
      revenue: 0,
      tags: [],
    })
    toast.success('Content created')
    setShowNewDialog(false)
    setNewForm({ title: '', description: '', platform: 'youtube', status: 'idea', thumbnail: '' })
  }

  const handleDelete = (id: string) => {
    deleteContent(id)
    toast.success('Content deleted')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Content</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.content.length} pieces of content</p>
        </div>
        <Button variant="primary" onClick={() => setShowNewDialog(true)}>
          <Plus size={14} />
          New Content
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={14} className="text-white/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search content..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={statusOptions}
          placeholder="Status"
          className="w-40"
          id="status-filter"
        />
        <Select
          value={platformFilter}
          onValueChange={setPlatformFilter}
          options={platformOptions}
          placeholder="Platform"
          className="w-36"
          id="platform-filter"
        />
        {allTags.length > 0 && (
          <Select
            value={tagFilter}
            onValueChange={setTagFilter}
            options={[{ value: '', label: 'All Tags' }, ...allTags.map(t => ({ value: t, label: t }))]}
            placeholder="Tag"
            className="w-36"
            id="tag-filter"
          />
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Bulk action bar */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 bg-violet/10 border-b border-white/[0.04]">
            <span className="text-sm text-violet font-medium">{selectedIds.length} selected</span>
            <button onClick={() => setSelectedIds([])} className="text-white/30 hover:text-white text-xs">Clear</button>
            <div className="flex items-center gap-2 ml-auto">
              <select
                value={bulkStatus}
                onChange={e => setBulkStatus(e.target.value as ContentStatus)}
                className="bg-white/[0.06] border border-white/[0.08] rounded px-2 py-1 text-xs text-white outline-none"
              >
                {statusOptions.slice(1).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <Button variant="secondary" size="sm" onClick={handleBulkStatus}>Apply Status</Button>
              <Button variant="destructive" size="sm" onClick={handleBulkDelete}>Delete</Button>
            </div>
          </div>
        )}
        {/* Table header */}
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/[0.04] text-[10px] font-mono text-white/20 uppercase tracking-wider">
          <span><input type="checkbox" checked={selectedIds.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="w-3.5 h-3.5 accent-violet cursor-pointer" /></span>
          <span>Content</span>
          <span>Platform</span>
          <span>Status</span>
          <span>Stats</span>
          <span>Eng.</span>
        </div>

        {filtered.length > 0 ? (
          <div className="px-4 pb-4">
            {filtered.map(content => (
              <ContentRow key={content.id} content={content} onDelete={handleDelete} selected={selectedIds.includes(content.id)} onToggle={toggleSelect} />
            ))}
            {/* Bottom safe area for mobile nav */}
            <div className="h-16 sm:h-0" />
          </div>
        ) : (
          <EmptyState
            icon={<FileVideo size={24} />}
            title="No content yet"
            description="Start by creating your first piece of content."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowNewDialog(true)}>
                <Plus size={14} />
                New Content
              </Button>
            }
          />
        )}
      </div>

      {/* New Content Dialog */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogHeader>
          <DialogTitle>New Content</DialogTitle>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <Input
            label="Title"
            value={newForm.title}
            onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
            placeholder="The title of your content..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Platform"
              value={newForm.platform}
              onValueChange={v => setNewForm(p => ({ ...p, platform: v as Platform }))}
              options={platformOptions.slice(1)}
              id="new-platform"
            />
            <Select
              label="Status"
              value={newForm.status}
              onValueChange={v => setNewForm(p => ({ ...p, status: v as ContentStatus }))}
              options={statusOptions.slice(1)}
              id="new-status"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Thumbnail</label>
              <button
                onClick={() => setGenerateOpen(true)}
                className="text-xs text-violet hover:text-violet/80 flex items-center gap-1 transition-colors"
              >
                <Wand2 size={11} /> Generate with AI
              </button>
            </div>
            <ThumbnailUpload
              value={newForm.thumbnail}
              onChange={dataUrl => setNewForm(p => ({ ...p, thumbnail: dataUrl || '' }))}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Description</label>
            <textarea
              value={newForm.description}
              onChange={e => setNewForm(p => ({ ...p, description: e.target.value }))}
              placeholder="Brief description..."
              rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 focus:bg-violet/5 transition-all resize-none"
            />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setShowNewDialog(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Create Content</Button>
        </DialogFooter>
      </Dialog>

      <ThumbnailGenerator
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        contentTitle={newForm.title}
        contentHook={newForm.description}
        platform={newForm.platform}
        onAccept={(dataUrl) => {
          setNewForm(p => ({ ...p, thumbnail: dataUrl }))
          toast.success('Thumbnail generated!')
        }}
      />
    </div>
  )
}
