'use client'

import { useState, useRef } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { FolderOpen, Upload, Trash2, FileVideo, FileImage, FileText, File, Eye, Edit, Search, Tag, SortAsc } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { LibraryItem } from '@/lib/types'

const typeIcon = (type: string) => {
  if (type.includes('video')) return <FileVideo size={16} className="text-red-400" />
  if (type.includes('image')) return <FileImage size={16} className="text-emerald-400" />
  if (type.includes('script') || type.includes('text')) return <FileText size={16} className="text-violet" />
  return <File size={16} className="text-white/30" />
}

const categories = ['All', 'Videos', 'Images', 'Thumbnails', 'Scripts', 'Documents', 'Other']
const typeMap: Record<string, string[]> = {
  Videos: ['video/mp4', 'video/webm'],
  Images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  Thumbnails: ['image/jpeg', 'image/png'],
  Scripts: ['text/plain'],
  Documents: ['application/pdf'],
  Other: [],
}

export default function LibraryPage() {
  const { data, addLibraryItem, updateLibraryItem, deleteLibraryItem } = useData()
  const [category, setCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name' | 'size'>('newest')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [renameId, setRenameId] = useState<string | null>(null)
  const [newName, setNewName] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const filtered = (() => {
    let items = category === 'All' ? data.library : data.library.filter(item => {
      const types = typeMap[category] || []
      return types.some(t => item.type.includes(t.split('/')[0]))
    })
    if (search) {
      const q = search.toLowerCase()
      items = items.filter(i => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q))
    }
    items = [...items].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'size') return b.size - a.size
      return 0
    })
    return items
  })()

  const preview = previewId ? data.library.find(i => i.id === previewId) : null

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return
    setUploadLoading(true)
    Array.from(files).forEach(file => {
      const reader = new FileReader()
      reader.onload = () => {
        addLibraryItem({
          name: file.name,
          type: (file.type.includes('video') ? 'video' : file.type.includes('image') ? 'image' : 'other') as 'video' | 'image' | 'thumbnail' | 'script' | 'document' | 'other',
          size: file.size,
          url: reader.result as string,
          category: file.type.includes('video') ? 'Videos' : file.type.includes('image') ? 'Images' : 'Other',
        })
      }
      reader.onerror = () => toast.error(`Failed to read ${file.name}`)
      reader.readAsDataURL(file)
    })
    setUploadLoading(false)
    toast.success(`${files.length} file(s) uploaded`)
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleDelete = () => {
    if (deleteId) { deleteLibraryItem(deleteId); toast.success('File deleted'); setDeleteId(null); setPreviewId(null) }
  }

  const handleRename = (id: string) => {
    if (!newName.trim()) return
    updateLibraryItem(id, { name: newName.trim() })
    toast.success('File renamed')
    setRenameId(null)
    setNewName('')
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Library</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.library.length} files stored</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" multiple onChange={handleUpload} className="hidden" />
          <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={uploadLoading}>
            <Upload size={14} />{uploadLoading ? 'Uploading...' : 'Upload Files'}
          </Button>
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium transition-colors', category === cat ? 'bg-violet/10 text-violet border border-violet/20' : 'bg-white/[0.03] text-white/40 border border-white/[0.06] hover:text-white/70')}>
            {cat}
          </button>
        ))}
      </div>

      {/* Search + Sort bar */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 flex-1 max-w-sm">
          <Search size={13} className="text-white/30 shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search files by name..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none" />
        </div>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-white/50 outline-none"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name A-Z</option>
          <option value="size">Largest first</option>
        </select>
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-violet">{selectedIds.length} selected</span>
            <Button variant="destructive" size="sm" onClick={() => {
              selectedIds.forEach(id => deleteLibraryItem(id))
              toast.success(`${selectedIds.length} files deleted`)
              setSelectedIds([])
            }}>Delete</Button>
            <button onClick={() => setSelectedIds([])} className="text-xs text-white/30 hover:text-white/60">Clear</button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState icon={<FolderOpen size={24} />} title="No files yet" description="Upload your first file to build your media library." action={<Button variant="secondary" onClick={() => fileRef.current?.click()}><Upload size={14} />Upload Files</Button>} />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {filtered.map(item => (
            <div key={item.id} className={cn(
              'group rounded-xl border overflow-hidden transition-colors cursor-pointer',
              selectedIds.includes(item.id) ? 'border-violet bg-violet/5' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]'
            )}
              onClick={() => setPreviewId(item.id)}>
              {/* Preview thumb */}
              <div className="aspect-video bg-white/[0.02] flex items-center justify-center relative">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={e => { e.stopPropagation(); setSelectedIds(prev => prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]) }}
                  className="absolute top-2 left-2 w-4 h-4 accent-violet z-10 cursor-pointer"
                />
                {item.url.startsWith('data:image') || item.url.startsWith('data:video') ? (
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                ) : item.url.startsWith('data:video') ? (
                  <video src={item.url} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-white/20">{typeIcon(item.type)}</div>
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={e => { e.stopPropagation(); setPreviewId(item.id) }} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-white">
                    <Eye size={14} />
                  </button>
                  <button onClick={e => { e.stopPropagation(); setDeleteId(item.id) }} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-white/70 truncate" title={item.name}>{item.name}</p>
                <p className="text-[10px] text-white/20 mt-1">{formatSize(item.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Dialog */}
      {preview && (
        <Dialog open={!!previewId} onOpenChange={v => !v && setPreviewId(null)}>
          <DialogBody className="p-0 max-w-2xl">
            {preview.url.startsWith('data:image') && (
              <img src={preview.url} alt={preview.name} className="w-full max-h-[60vh] object-contain bg-black/50 rounded-t-xl" />
            )}
            {preview.url.startsWith('data:video') && (
              <video src={preview.url} controls className="w-full max-h-[60vh] bg-black/50 rounded-t-xl" />
            )}
            <div className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {typeIcon(preview.type)}
                  <div>
                    <p className="text-sm font-medium text-white">{preview.name}</p>
                    <p className="text-xs text-white/30">{formatSize(preview.size)} · {formatDate(preview.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => { setRenameId(preview.id); setNewName(preview.name); setPreviewId(null) }}
                    className="text-xs text-white/40 hover:text-white/70 px-2 py-1 rounded bg-white/[0.04]">
                    <Edit size={12} className="inline mr-1" />Rename
                  </button>
                  <button onClick={() => { setDeleteId(preview.id); setPreviewId(null) }}
                    className="text-xs text-red-400/60 hover:text-red-400 px-2 py-1 rounded bg-white/[0.04]">
                    <Trash2 size={12} className="inline mr-1" />Delete
                  </button>
                </div>
              </div>
              {preview.url.startsWith('data:video') && (
                <div className="flex gap-2">
                  <Button variant="primary" size="sm" onClick={() => { navigator.clipboard.writeText(preview.url); toast.success('URL copied') }}>
                    Copy URL
                  </Button>
                </div>
              )}
            </div>
          </DialogBody>
        </Dialog>
      )}

      {/* Rename Dialog */}
      {renameId && (
        <Dialog open={!!renameId} onOpenChange={v => !v && setRenameId(null)}>
          <DialogHeader><DialogTitle>Rename File</DialogTitle></DialogHeader>
          <DialogBody>
            <Input label="Name" value={newName} onChange={e => setNewName(e.target.value)} autoFocus />
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRenameId(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => handleRename(renameId)}>Rename</Button>
          </DialogFooter>
        </Dialog>
      )}

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete file?" description="This will permanently delete this file from your library." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  )
}
