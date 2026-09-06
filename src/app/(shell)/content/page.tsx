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
  Trash2, Edit, ThumbsUp, MessageCircle, Share2, Eye,
} from 'lucide-react'
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

function ContentRow({ content, onDelete }: { content: Content; onDelete: (id: string) => void }) {
  const [showDelete, setShowDelete] = useState(false)

  return (
    <>
      <Link
        href={`/content/${content.id}`}
        className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 py-4 border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors px-4 -mx-4"
      >
        {/* Info */}
        <div className="flex items-center gap-3 min-w-0">
          {content.thumbnail && (
            <img src={content.thumbnail} alt="" className="w-14 h-9 rounded-lg object-cover flex-shrink-0" />
          )}
          {!content.thumbnail && (
            <div className="w-14 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
              <FileVideo size={14} className="text-white/20" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-white/90 truncate">{content.title}</p>
            <p className="text-xs text-white/30 mt-0.5">
              {content.status === 'published' && content.publishedAt ? formatDate(content.publishedAt) : content.scheduledAt ? `Scheduled ${formatDate(content.scheduledAt)}` : formatDate(content.createdAt)}
            </p>
          </div>
        </div>

        {/* Platform */}
        <Badge variant="platform" platform={content.platform} />

        {/* Status */}
        <Badge variant="status" status={content.status} />

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-white/30">
          <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(content.views)}</span>
          <span className="flex items-center gap-1"><ThumbsUp size={12} />{formatNumber(content.likes)}</span>
          <span className="hidden sm:flex items-center gap-1"><MessageCircle size={12} />{formatNumber(content.comments)}</span>
        </div>

        {/* Engagement */}
        <div className="text-right">
          <p className="text-sm font-mono text-white/60">{content.engagementRate > 0 ? `${content.engagementRate}%` : '—'}</p>
        </div>
      </Link>

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
  const { data, addContent, deleteContent } = useData()
  const router = useRouter()
  const searchParams = useSearchParams()
  const showNew = searchParams.get('new') === 'true'

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [platformFilter, setPlatformFilter] = useState('')
  const [showNewDialog, setShowNewDialog] = useState(showNew)
  const [newForm, setNewForm] = useState({
    title: '',
    description: '',
    platform: 'youtube' as Platform,
    status: 'idea' as ContentStatus,
  })

  const filtered = data.content.filter(c => {
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && c.status !== statusFilter) return false
    if (platformFilter && c.platform !== platformFilter) return false
    return true
  })

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
    setNewForm({ title: '', description: '', platform: 'youtube', status: 'idea' })
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
      </div>

      {/* Table */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-white/[0.04] text-[10px] font-mono text-white/20 uppercase tracking-wider">
          <span>Content</span>
          <span>Platform</span>
          <span>Status</span>
          <span>Stats</span>
          <span>Eng.</span>
        </div>

        {filtered.length > 0 ? (
          <div className="px-4 pb-4">
            {filtered.map(content => (
              <ContentRow key={content.id} content={content} onDelete={handleDelete} />
            ))}
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
    </div>
  )
}
