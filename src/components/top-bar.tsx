'use client'

import { useState } from 'react'
import { Search, Bell, Plus, X, User, Settings, LogOut, ChevronRight, Menu, FileVideo, Lightbulb, PenTool, Sun, Moon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useData } from '@/lib/data-context'
import { getInitials } from '@/lib/utils'
import { Dialog, DialogHeader, DialogTitle, DialogBody } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const quickActions = [
  { label: 'New Content', href: '/content?new=true' },
  { label: 'Add Idea', href: '/ideas?new=true' },
  { label: 'Write Script', href: '/scripts?new=true' },
  { label: 'Add Sponsor', href: '/sponsors?new=true' },
  { label: 'Schedule Content', href: '/calendar?new=true' },
]

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const { data, updateSettings } = useData()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) return

    const q = encodeURIComponent(query)
    // Search across content, ideas, and scripts
    router.push(`/content?q=${q}`)
    setSearchOpen(false)
    setQuery('')
  }

  const filteredContent = data.content.filter(c =>
    c.title.toLowerCase().includes(query.toLowerCase())
  )
  const filteredIdeas = data.ideas.filter(i =>
    i.title.toLowerCase().includes(query.toLowerCase()) ||
    i.description?.toLowerCase().includes(query.toLowerCase())
  )
  const filteredScripts = data.scripts.filter(s =>
    s.title.toLowerCase().includes(query.toLowerCase())
  )

  const initials = getInitials(data.settings.profile.name)

  return (
    <>
      <header className={cn(
        'fixed top-0 right-0 z-30 h-16 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md border-b border-white/[0.05] transition-all duration-300',
        'ml-0 md:ml-[240px]'
      )}>
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="mr-3 md:hidden w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
        >
          <Menu size={15} />
        </button>

        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 w-48 md:w-64 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search content...</span>
          <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded font-mono text-white/20">⌘K</kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={() => {
              const next = data.settings.theme === 'dark' ? 'light' : 'dark'
              updateSettings({ theme: next })
            }}
            className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
          >
            {data.settings.theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false) }}
              className="w-9 h-9 rounded-lg bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
            >
              <Bell size={15} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet" />
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-12 w-72 rounded-xl border border-white/[0.08] bg-surface-raised shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Notifications</p>
                  <button onClick={() => setNotifOpen(false)} className="text-white/20 hover:text-white/40"><X size={14} /></button>
                </div>
                {(() => {
                  const today = new Date().toISOString().split('T')[0]
                  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
                  const recItems = data.content.filter(c =>
                    c.status === 'recording' || (c.scheduledAt && c.scheduledAt <= tomorrow && c.status !== 'published')
                  )
                  if (recItems.length === 0) return (
                    <div className="p-4 text-center text-sm text-white/30">
                      <Bell size={20} className="mx-auto mb-2 opacity-30" />
                      <p>All caught up!</p>
                    </div>
                  )
                  return (
                    <div className="max-h-64 overflow-y-auto">
                      {recItems.slice(0, 5).map(c => (
                        <div key={c.id} className="px-4 py-3 border-b border-white/[0.04] hover:bg-white/[0.02]">
                          <p className="text-sm text-white/80 font-medium">{c.title}</p>
                          <p className="text-xs text-white/30 mt-0.5">
                            {c.status === 'recording' ? '🎬 Ready to record' : c.scheduledAt === today ? '📅 Recording today' : '📅 Recording soon'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>

          {/* Quick create */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="gap-1.5"
          >
            <Plus size={14} />
            Create
          </Button>

          {/* Avatar / Profile */}
          <div className="relative">
            <button
              onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false) }}
              className="w-8 h-8 rounded-full bg-violet/20 border border-violet/30 flex items-center justify-center text-xs font-semibold text-violet overflow-hidden"
            >
              {data.settings.profile.avatar ? (
                <img src={data.settings.profile.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                initials
              )}
            </button>
            {profileOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-xl border border-white/[0.08] bg-surface-raised shadow-xl z-50 overflow-hidden">
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-sm font-medium text-white truncate">{data.settings.profile.name}</p>
                  <p className="text-xs text-white/30">@{data.settings.profile.handle}</p>
                </div>
                <div className="p-1">
                  <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <Settings size={14} />Settings
                  </Link>
                  <button onClick={() => { router.push('/'); setProfileOpen(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors">
                    <LogOut size={14} />Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogBody className="p-0 gap-0">
          <form onSubmit={handleSearch} className="flex items-center gap-3 p-4 border-b border-white/[0.06]">
            <Search size={16} className="text-white/30" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search content, ideas, scripts..."
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 outline-none"
            />
            <button type="button" onClick={() => setSearchOpen(false)} className="text-white/20 hover:text-white/40">
              <X size={14} />
            </button>
          </form>

          {query.trim() ? (
            <div className="max-h-80 overflow-y-auto">
              {filteredContent.length > 0 && (
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Content</p>
                  {filteredContent.slice(0, 3).map(c => (
                    <button key={c.id} onClick={() => { router.push(`/content/${c.id}`); setSearchOpen(false) }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/[0.05] text-left">
                      <FileVideo size={12} className="text-white/20 shrink-0" />
                      <span className="truncate">{c.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {filteredIdeas.length > 0 && (
                <div className="p-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Ideas</p>
                  {filteredIdeas.slice(0, 3).map(i => (
                    <button key={i.id} onClick={() => { router.push(`/ideas?id=${i.id}`); setSearchOpen(false) }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/[0.05] text-left">
                      <Lightbulb size={12} className="text-white/20 shrink-0" />
                      <span className="truncate">{i.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {filteredScripts.length > 0 && (
                <div className="p-3">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-wider mb-2">Scripts</p>
                  {filteredScripts.slice(0, 3).map(s => (
                    <button key={s.id} onClick={() => { router.push(`/scripts?id=${s.id}`); setSearchOpen(false) }}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-white/60 hover:text-white hover:bg-white/[0.05] text-left">
                      <PenTool size={12} className="text-white/20 shrink-0" />
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {filteredContent.length === 0 && filteredIdeas.length === 0 && filteredScripts.length === 0 && (
                <div className="p-6 text-center text-sm text-white/30">No results for "{query}"</div>
              )}
            </div>
          ) : (
            <div className="p-4">
              <p className="text-xs text-white/30 mb-3">Quick actions</p>
              <div className="space-y-1">
                {quickActions.map(action => (
                  <button
                    key={action.label}
                    onClick={() => {
                      router.push(action.href)
                      setSearchOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <Plus size={14} className="text-violet" />
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </DialogBody>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogBody className="p-0">
          <div className="p-4 border-b border-white/[0.06]">
            <p className="text-sm font-semibold text-white">Create new</p>
          </div>
          <div className="p-2">
            {quickActions.map(action => (
              <button
                key={action.label}
                onClick={() => {
                  router.push(action.href)
                  setCreateOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/70 hover:text-white hover:bg-white/[0.05] transition-colors text-left"
              >
                <Plus size={14} className="text-violet" />
                {action.label}
              </button>
            ))}
          </div>
        </DialogBody>
      </Dialog>
    </>
  )
}
