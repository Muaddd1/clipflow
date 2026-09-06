'use client'

import { useState } from 'react'
import { Search, Bell, Plus, X, User, Settings, LogOut, ChevronRight } from 'lucide-react'
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

export function TopBar() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const router = useRouter()
  const { data } = useData()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/content?q=${encodeURIComponent(query)}`)
      setSearchOpen(false)
      setQuery('')
    }
  }

  const initials = getInitials(data.settings.profile.name)

  return (
    <>
      <header className="sticky top-0 z-30 h-16 flex items-center justify-between px-6 bg-surface/80 backdrop-blur-md border-b border-white/[0.05]">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-white/60 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 w-64 transition-colors"
        >
          <Search size={14} />
          <span className="flex-1 text-left text-xs">Search content...</span>
          <kbd className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded font-mono text-white/20">⌘K</kbd>
        </button>

        {/* Right side */}
        <div className="flex items-center gap-3">
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
                <div className="p-4 text-center text-sm text-white/30">
                  <Bell size={20} className="mx-auto mb-2 opacity-30" />
                  <p>All caught up!</p>
                  <p className="text-xs text-white/20 mt-1">New features coming soon</p>
                </div>
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
