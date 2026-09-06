'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { EmptyState } from '@/components/ui/empty-state'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Handshake, Plus, Trash2, DollarSign } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Sponsor, SponsorStatus, PaymentStatus } from '@/lib/types'
import { toast } from 'sonner'

const statusOptions = [
  { value: '', label: 'All Statuses' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'paid', label: 'Paid' },
]

const paymentOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
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
  const [filter, setFilter] = useState('')
  const [form, setForm] = useState(defaultForm)

  const detail = detailId ? data.sponsors.find(s => s.id === detailId) : null
  const totalRevenue = data.sponsors.reduce((s, sp) => s + (sp.paymentStatus === 'paid' ? sp.dealValue : 0), 0)
  const activeDeals = data.sponsors.filter(sp => ['negotiating','approved','in_progress'].includes(sp.status)).length

  const filtered = data.sponsors.filter(sp => !filter || sp.status === filter)

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setForm(defaultForm)
      setDialogOpen(true)
    }
  }, [searchParams])

  const handleAdd = () => {
    if (!form.company.trim()) { toast.error('Company name is required'); return }
    addSponsor(form)
    toast.success('Sponsor added')
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
    toast.success('Sponsor updated')
    setDetailId(null)
    setDetailDraft({})
  }

  const handleDelete = () => {
    if (deleteId) { deleteSponsor(deleteId); toast.success('Sponsor deleted'); setDeleteId(null) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Sponsors</h1>
          <p className="text-white/40 text-sm mt-0.5">{data.sponsors.length} sponsors · {activeDeals} active deals</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}><Plus size={14} />Add Sponsor</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-white/30">Total Earned</p>
            <p className="text-xl font-bold text-white">${formatNumber(totalRevenue)}</p>
          </div>
        </div>
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet/10 flex items-center justify-center">
            <Handshake size={18} className="text-violet" />
          </div>
          <div>
            <p className="text-xs text-white/30">Active Deals</p>
            <p className="text-xl font-bold text-white">{activeDeals}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <Select value={filter} onValueChange={setFilter} options={statusOptions} placeholder="Filter by status" className="w-48" />

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState icon={<Handshake size={24} />} title="No sponsors yet" description="Add your first sponsor to start tracking deals." action={<Button variant="primary" onClick={() => setDialogOpen(true)}><Plus size={14} />Add Sponsor</Button>} />
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                {['Company','Contact','Campaign','Deal','Status','Deadline',''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[10px] font-mono text-white/20 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(sp => (
                <tr key={sp.id} onClick={() => openDetail(sp.id)} className="border-b border-white/[0.04] hover:bg-white/[0.02] cursor-pointer transition-colors">
                  <td className="px-4 py-4"><p className="text-sm font-medium text-white/90">{sp.company}</p></td>
                  <td className="px-4 py-4"><p className="text-sm text-white/50">{sp.contact}</p></td>
                  <td className="px-4 py-4"><p className="text-sm text-white/50 truncate max-w-[150px]">{sp.campaign}</p></td>
                  <td className="px-4 py-4"><p className="text-sm font-mono text-white/80">${formatNumber(sp.dealValue)}</p></td>
                  <td className="px-4 py-4"><Badge variant="status" status={sp.status} /></td>
                  <td className="px-4 py-4"><p className="text-xs text-white/30">{sp.deadline ? formatDate(sp.deadline) : '—'}</p></td>
                  <td className="px-4 py-4">
                    <button onClick={e => { e.stopPropagation(); setDeleteId(sp.id) }} className="text-white/20 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!detailId} onOpenChange={v => !v && setDetailId(null)}>
        <DialogBody className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{detailDraft.company}</h2>
            <Badge variant="status" status={(detailDraft.status || 'contacted') as SponsorStatus} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact" value={detailDraft.contact || ''} onChange={e => setDetailDraft(p => ({ ...p, contact: e.target.value }))} />
            <Input label="Email" value={detailDraft.email || ''} onChange={e => setDetailDraft(p => ({ ...p, email: e.target.value }))} />
          </div>
          <Input label="Campaign" value={detailDraft.campaign || ''} onChange={e => setDetailDraft(p => ({ ...p, campaign: e.target.value }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Deal Value ($)" type="number" value={detailDraft.dealValue || 0} onChange={e => setDetailDraft(p => ({ ...p, dealValue: +e.target.value }))} />
            <Select label="Status" value={detailDraft.status || 'contacted'} onValueChange={v => setDetailDraft(p => ({ ...p, status: v as SponsorStatus }))} options={statusOptions.slice(1)} />
            <Select label="Payment" value={detailDraft.paymentStatus || 'pending'} onValueChange={v => setDetailDraft(p => ({ ...p, paymentStatus: v as PaymentStatus }))} options={paymentOptions} />
          </div>
          <Input label="Deadline" type="date" value={detailDraft.deadline || ''} onChange={e => setDetailDraft(p => ({ ...p, deadline: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Notes</label>
            <textarea value={detailDraft.notes || ''} onChange={e => setDetailDraft(p => ({ ...p, notes: e.target.value }))} rows={3}
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 resize-none" />
          </div>
          <DialogFooter className="p-0 pt-2 gap-2">
            <Button variant="secondary" onClick={() => setDetailId(null)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveDetail}>Save Changes</Button>
          </DialogFooter>
        </DialogBody>
      </Dialog>

      {/* New Sponsor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader><DialogTitle>Add Sponsor</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Company" value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Brand/company name..." />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Contact name..." />
            <Input label="Email" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@company.com" />
          </div>
          <Input label="Campaign" value={form.campaign} onChange={e => setForm(p => ({ ...p, campaign: e.target.value }))} placeholder="Campaign name..." />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Deal Value ($)" type="number" value={form.dealValue} onChange={e => setForm(p => ({ ...p, dealValue: +e.target.value }))} />
            <Select label="Status" value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v as SponsorStatus }))} options={statusOptions.slice(1)} />
            <Select label="Payment" value={form.paymentStatus} onValueChange={v => setForm(p => ({ ...p, paymentStatus: v as PaymentStatus }))} options={paymentOptions} />
          </div>
          <Input label="Deadline" type="date" value={form.deadline} onChange={e => setForm(p => ({ ...p, deadline: e.target.value }))} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Notes about this deal..."
              className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 resize-none" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Add Sponsor</Button>
        </DialogFooter>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="Delete sponsor?" description="This will permanently delete this sponsor." confirmLabel="Delete" destructive onConfirm={handleDelete} />
    </div>
  )
}
