'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Handshake, Plus, Trash2, DollarSign, ExternalLink, GripVertical, ChevronDown } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Sponsor, SponsorStatus, PaymentStatus } from '@/lib/types'
import { toast } from 'sonner'

const COLUMNS: { id: SponsorStatus; label: string; color: string }[] = [
  { id: 'contacted', label: 'Contacted', color: '#6b7280' },
  { id: 'negotiating', label: 'Negotiating', color: '#f59e0b' },
  { id: 'approved', label: 'Approved', color: '#3b82f6' },
  { id: 'in_progress', label: 'In Progress', color: '#8b5cf6' },
  { id: 'completed', label: 'Completed', color: '#22c55e' },
  { id: 'paid', label: 'Paid', color: '#10b981' },
]

const defaultForm = {
  company: '', contact: '', email: '', campaign: '',
  dealValue: 0, status: 'contacted' as SponsorStatus, paymentStatus: 'pending' as PaymentStatus,
  deadline: '', notes: '',
}

export default function SponsorsPage() {
  const { data, addSponsor, updateSponsor, deleteSponsor } = useData()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [detailDraft, setDetailDraft] = useState<Partial<Sponsor>>({})
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState(defaultForm)

  const detail = detailId ? data.sponsors.find(s => s.id === detailId) : null

  const totalRevenue = data.sponsors.reduce((s, sp) => s + (sp.paymentStatus === 'paid' ? sp.dealValue : 0), 0)
  const activeDeals = data.sponsors.filter(sp => ['negotiating', 'approved', 'in_progress'].includes(sp.status)).length
  const totalPipeline = data.sponsors.reduce((s, sp) => s + sp.dealValue, 0)

  const getColumnSponsors = (status: SponsorStatus) =>
    data.sponsors.filter(sp => sp.status === status)

  const handleAdd = () => {
    if (!form.company.trim()) { toast.error('Company name is required'); return }
    addSponsor(form)
    toast.success('Sponsor deal added')
    setDialogOpen(false)
    setForm(defaultForm)
  }

  const openDetail = (id: string) => {
    const sp = data.sponsors.find(s => s.id === id)
    if (sp) setDetailDraft({ ...sp })
    setDetailId(id)
  }

  const handleSaveDetail = () => {
    if (!detailId) return
    updateSponsor(detailId, detailDraft as Sponsor)
    toast.success('Deal updated')
    setDetailId(null)
  }

  const handleDelete = () => {
    if (deleteId) { deleteSponsor(deleteId); toast.success('Sponsor deleted'); setDeleteId(null) }
  }

  const handleMoveStage = (id: string, newStatus: SponsorStatus) => {
    updateSponsor(id, { status: newStatus })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsor CRM</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.sponsors.length} deals · {activeDeals} active</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-6 text-sm">
            <div className="text-center">
              <p className="text-lg font-bold text-white">${formatNumber(totalRevenue)}</p>
              <p className="text-xs text-white/30">Earned</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">${formatNumber(totalPipeline)}</p>
              <p className="text-xs text-white/30">Pipeline</p>
            </div>
          </div>
          <Button variant="primary" onClick={() => setDialogOpen(true)}>
            <Plus size={14} />New Deal
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ minWidth: 'max-content' }}>
          {COLUMNS.map(col => {
            const colSponsors = getColumnSponsors(col.id)
            const colValue = colSponsors.reduce((s, sp) => s + sp.dealValue, 0)
            return (
              <div key={col.id} className="w-64 shrink-0">
                {/* Column header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: col.color }} />
                    <span className="text-sm font-semibold text-white/70">{col.label}</span>
                    <span className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded text-white/30">{colSponsors.length}</span>
                  </div>
                  <span className="text-xs font-mono text-white/25">${formatNumber(colValue)}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {colSponsors.map(sp => (
                    <div
                      key={sp.id}
                      onClick={() => openDetail(sp.id)}
                      className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 hover:bg-white/[0.05] transition-colors cursor-pointer group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-semibold text-white/90 group-hover:text-white truncate flex-1">{sp.company}</p>
                        <button
                          onClick={e => { e.stopPropagation(); setDeleteId(sp.id) }}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 transition-all shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      {sp.campaign && (
                        <p className="text-xs text-white/30 mb-2 truncate">{sp.campaign}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">${formatNumber(sp.dealValue)}</span>
                        <Badge
                          variant="default"
                          className={cn(
                            'text-[10px]',
                            sp.paymentStatus === 'paid' ? 'bg-green-500/10 text-green-400' :
                            sp.paymentStatus === 'partial' ? 'bg-amber-500/10 text-amber-400' :
                            'bg-white/[0.06] text-white/30'
                          )}
                        >
                          {sp.paymentStatus}
                        </Badge>
                      </div>
                      {sp.deadline && (
                        <p className="text-[10px] text-white/20 mt-2">Due {formatDate(sp.deadline)}</p>
                      )}
                    </div>
                  ))}

                  {colSponsors.length === 0 && (
                    <div className="rounded-xl border border-dashed border-white/[0.04] p-4 text-center">
                      <p className="text-xs text-white/15">No deals</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Deal detail */}
      <Dialog open={!!detailId} onOpenChange={v => !v && setDetailId(null)}>
        <DialogHeader><DialogTitle>{detail?.company}</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company" value={detailDraft.company || ''} onChange={e => setDetailDraft(p => ({ ...p, company: e.target.value }))} />
            <Input label="Contact" value={detailDraft.contact || ''} onChange={e => setDetailDraft(p => ({ ...p, contact: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={detailDraft.email || ''} onChange={e => setDetailDraft(p => ({ ...p, email: e.target.value }))} />
            <Input label="Campaign" value={detailDraft.campaign || ''} onChange={e => setDetailDraft(p => ({ ...p, campaign: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Deal Value ($)" type="number" value={detailDraft.dealValue || 0} onChange={e => setDetailDraft(p => ({ ...p, dealValue: +e.target.value }))} />
            <Select label="Stage" value={detailDraft.status || 'contacted'} onValueChange={v => setDetailDraft(p => ({ ...p, status: v as SponsorStatus }))}
              options={COLUMNS.map(c => ({ value: c.id, label: c.label }))} id="sponsor-status" />
            <Select label="Payment" value={detailDraft.paymentStatus || 'pending'} onValueChange={v => setDetailDraft(p => ({ ...p, paymentStatus: v as PaymentStatus }))}
              options={[{value:'pending',label:'Pending'},{value:'partial',label:'Partial'},{value:'paid',label:'Paid'}]} id="sponsor-payment" />
          </div>
          <Input label="Deadline" type="date" value={detailDraft.deadline || ''} onChange={e => setDetailDraft(p => ({ ...p, deadline: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Notes</label>
            <textarea value={detailDraft.notes || ''} onChange={e => setDetailDraft(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="Deal notes, terms, deliverables..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 resize-none" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDetailId(null)}>Cancel</Button>
          <Button variant="primary" onClick={handleSaveDetail}>Save Changes</Button>
        </DialogFooter>
      </Dialog>

      {/* New deal dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader><DialogTitle>New Sponsor Deal</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Brand name..." />
            <Input label="Contact" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Contact name..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="email@brand.com" />
            <Input label="Campaign" value={form.campaign} onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))} placeholder="Campaign name..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Deal Value ($)" type="number" value={form.dealValue} onChange={e => setForm(p => ({ ...p, dealValue: +e.target.value }))} />
            <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
              placeholder="Deal notes..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 resize-none" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Deal</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete deal?" description="This will permanently delete this sponsor deal." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  )
}
