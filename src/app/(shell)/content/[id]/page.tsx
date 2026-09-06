'use client'

import { useParams, useRouter } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { EmptyState } from '@/components/ui/empty-state'
import {
  ArrowLeft, ThumbsUp, MessageCircle, Share2, Eye,
  Calendar, DollarSign, FileText, Edit, Trash2, ExternalLink,
} from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import { useState } from 'react'
import { toast } from 'sonner'
import type { ContentStatus, Platform } from '@/lib/types'

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const statusOptions = [
  { value: 'idea', label: 'Idea' },
  { value: 'developing', label: 'Developing' },
  { value: 'ready_to_script', label: 'Ready to Script' },
  { value: 'recording', label: 'Recording' },
  { value: 'editing', label: 'Editing' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

export default function ContentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { getContent, updateContent, deleteContent, getScript } = useData()

  const content = getContent(params.id as string)
  const script = content?.scriptId ? getScript(content.scriptId) : undefined

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    title: content?.title || '',
    description: content?.description || '',
    platform: content?.platform || 'youtube',
    status: content?.status || 'idea',
    views: content?.views || 0,
    likes: content?.likes || 0,
    comments: content?.comments || 0,
    shares: content?.shares || 0,
    engagementRate: content?.engagementRate || 0,
    revenue: content?.revenue || 0,
  })

  if (!content) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <EmptyState
          icon={<FileText size={24} />}
          title="Content not found"
          description="This content may have been deleted."
          action={<Button variant="secondary" onClick={() => router.push('/content')}>Back to Content</Button>}
        />
      </div>
    )
  }

  const handleSave = () => {
    updateContent(content.id, {
      ...editForm,
      engagementRate: editForm.views > 0
        ? Number(((editForm.likes + editForm.comments + editForm.shares) / editForm.views * 100).toFixed(1))
        : 0,
    })
    toast.success('Content updated')
    setEditOpen(false)
  }

  const handleDelete = () => {
    deleteContent(content.id)
    toast.success('Content deleted')
    router.push('/content')
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/content')}
            className="w-9 h-9 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft size={15} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{content.title}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="platform" platform={content.platform} />
              <Badge variant="status" status={content.status} />
              <span className="text-xs text-white/20">
                {content.status === 'published' && content.publishedAt ? `Published ${formatDate(content.publishedAt)}` : content.scheduledAt ? `Scheduled ${formatDate(content.scheduledAt)}` : `Created ${formatDate(content.createdAt)}`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Edit size={14} />
            Edit
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} />
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: 'Views', value: formatNumber(content.views) },
          { icon: ThumbsUp, label: 'Likes', value: formatNumber(content.likes) },
          { icon: MessageCircle, label: 'Comments', value: formatNumber(content.comments) },
          { icon: Share2, label: 'Shares', value: formatNumber(content.shares) },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 text-center">
            <stat.icon size={16} className="text-white/30 mx-auto mb-2" />
            <p className="text-xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Engagement + Revenue */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2">Engagement Rate</p>
          <p className="text-3xl font-bold text-white">{content.engagementRate > 0 ? `${content.engagementRate}%` : '—'}</p>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-xs font-mono text-white/30 uppercase tracking-wider mb-2">Revenue</p>
          <p className="text-3xl font-bold text-white">{content.revenue > 0 ? `$${formatNumber(content.revenue)}` : '—'}</p>
        </div>
      </div>

      {/* Description */}
      {content.description && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-3">Description</h3>
          <p className="text-sm text-white/50 leading-relaxed">{content.description}</p>
        </div>
      )}

      {/* Script */}
      {script && (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white/70">Script</h3>
            <a href="/scripts" className="text-xs text-violet hover:text-violet/80">View script →</a>
          </div>
          <p className="text-sm font-medium text-white">{script.title}</p>
          <p className="text-xs text-white/30 mt-1">{script.wordCount} words · {script.charCount} characters</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogHeader><DialogTitle>Edit Content</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Title" value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Platform" value={editForm.platform} onValueChange={v => setEditForm(p => ({ ...p, platform: v as Platform }))} options={platformOptions} id="content-platform" />
            <Select label="Status" value={editForm.status} onValueChange={v => setEditForm(p => ({ ...p, status: v as ContentStatus }))} options={statusOptions} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <Input label="Views" type="number" value={editForm.views} onChange={e => setEditForm(p => ({ ...p, views: +e.target.value }))} />
            <Input label="Likes" type="number" value={editForm.likes} onChange={e => setEditForm(p => ({ ...p, likes: +e.target.value }))} />
            <Input label="Comments" type="number" value={editForm.comments} onChange={e => setEditForm(p => ({ ...p, comments: +e.target.value }))} />
            <Input label="Shares" type="number" value={editForm.shares} onChange={e => setEditForm(p => ({ ...p, shares: +e.target.value }))} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete content?"
        description="This will permanently delete this content and cannot be undone."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
