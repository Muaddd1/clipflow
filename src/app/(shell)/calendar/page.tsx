'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Dialog, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Calendar as CalendarIcon, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { platformColor, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Platform, ContentStatus } from '@/lib/types'
import { toast } from 'sonner'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function CalendarPage() {
  const { data, addCalendarEvent, deleteCalendarEvent } = useData()
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newForm, setNewForm] = useState({ title: '', platform: 'youtube' as Platform, date: '', status: 'scheduled' as ContentStatus })
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [deleteEventId, setDeleteEventId] = useState<string | null>(null)

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevDays = new Date(year, month, 0).getDate()

  const events = data.calendar.filter(e => {
    const d = new Date(e.date)
    return d.getFullYear() === year && d.getMonth() === month
  })

  const searchParams = useSearchParams()
  useEffect(() => {
    if (searchParams.get('new') === 'true') setDialogOpen(true)
  }, [searchParams])

  const goPrev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }
  const goNext = () => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }

  const handleAdd = () => {
    if (!newForm.title.trim() || !newForm.date) { toast.error('Title and date required'); return }
    addCalendarEvent({ ...newForm, contentId: '' })
    toast.success('Content scheduled')
    setDialogOpen(false)
    setNewForm({ title: '', platform: 'youtube', date: '', status: 'scheduled' })
  }

  const grid: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) grid.push(prevDays - firstDay + i + 1)
  for (let d = 1; d <= daysInMonth; d++) grid.push(d)
  while (grid.length % 7 !== 0) grid.push(null)

  const today = new Date()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Calendar</h1>
          <p className="text-white/40 text-sm mt-0.5">{events.length} content scheduled this month</p>
        </div>
        <Button variant="primary" onClick={() => setDialogOpen(true)}><Plus size={14} />Schedule Content</Button>
      </div>

      {/* Calendar */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.04]">
          <button onClick={goPrev} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <ChevronLeft size={15} />
          </button>
          <h2 className="text-base font-semibold text-white">{MONTHS[month]} {year}</h2>
          <button onClick={goNext} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-white/[0.04]">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center py-2 text-[10px] font-mono text-white/25 uppercase tracking-wider">{d}</div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7">
          {grid.map((day, idx) => {
            const isToday = day && year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
            const dateStr = day ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : null
            const dayEvents = dateStr ? events.filter(e => e.date === dateStr) : []
            return (
              <div key={idx} className={cn(
                'min-h-[100px] p-2 border-b border-r border-white/[0.04]',
                idx % 7 === 6 && 'border-r-0',
                !day && 'bg-white/[0.01]',
              )}>
                {day && (
                  <>
                    <div className={cn('text-xs font-mono mb-1', isToday ? 'w-6 h-6 rounded-full bg-violet text-white flex items-center justify-center' : 'text-white/30')}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event.id)}
                          className="w-full text-[10px] px-1.5 py-1 rounded truncate cursor-pointer hover:opacity-80 transition-opacity text-left block"
                          style={{ backgroundColor: `${platformColor(event.platform)}20`, color: platformColor(event.platform) }}
                          title={event.title}
                        >
                          {event.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && (
                        <p className="text-[10px] text-white/20 text-center">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Schedule Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogHeader><DialogTitle>Schedule Content</DialogTitle></DialogHeader>
        <DialogBody className="space-y-4">
          <Input label="Title" value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))} placeholder="Content title..." />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Platform" value={newForm.platform} onValueChange={v => setNewForm(p => ({ ...p, platform: v as Platform }))}
              options={[{value:'youtube',label:'YouTube'},{value:'tiktok',label:'TikTok'},{value:'instagram',label:'Instagram'},{value:'x',label:'X'},{value:'linkedin',label:'LinkedIn'}]} id="cal-platform" />
            <Input label="Date" type="date" value={newForm.date} onChange={e => setNewForm(p => ({ ...p, date: e.target.value }))} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd}>Schedule</Button>
        </DialogFooter>
      </Dialog>

      {/* Event Detail Dialog */}
      {selectedEvent && (() => {
        const event = data.calendar.find(e => e.id === selectedEvent)
        if (!event) return null
        return (
          <Dialog open={!!selectedEvent} onOpenChange={v => !v && setSelectedEvent(null)}>
            <DialogHeader>
              <DialogTitle>{event.title}</DialogTitle>
            </DialogHeader>
            <DialogBody className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="platform" platform={event.platform} />
                <Badge variant="status" status={event.status} />
              </div>
              <div className="text-sm text-white/50">
                <p><span className="text-white/30">Date:</span> {formatDate(event.date)}</p>
                {event.time && <p><span className="text-white/30">Time:</span> {event.time}</p>}
              </div>
            </DialogBody>
            <DialogFooter>
              <Button variant="destructive" size="sm" onClick={() => { setDeleteEventId(event.id); setSelectedEvent(null) }}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setSelectedEvent(null)}>Close</Button>
            </DialogFooter>
          </Dialog>
        )
      })()}

      <ConfirmDialog
        open={!!deleteEventId}
        onOpenChange={v => !v && setDeleteEventId(null)}
        title="Delete scheduled content?"
        description="This will remove it from your calendar."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteEventId) {
            deleteCalendarEvent(deleteEventId)
            toast.success('Event deleted')
            setDeleteEventId(null)
          }
        }}
      />
    </div>
  )
}
