'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FileVideo,
  Lightbulb,
  Calendar,
  PenTool,
  Handshake,
  BarChart3,
  Recycle,
  FolderOpen,
  Settings,
  ChevronLeft,
  Film,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useData } from '@/lib/data-context'

const nav = [
  {
    label: 'Main',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/content', label: 'Content', icon: FileVideo },
      { href: '/ideas', label: 'Ideas', icon: Lightbulb },
      { href: '/calendar', label: 'Calendar', icon: Calendar },
      { href: '/scripts', label: 'Scripts', icon: PenTool },
    ],
  },
  {
    label: 'Business',
    items: [
      { href: '/sponsors', label: 'Sponsors', icon: Handshake },
      { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Tools',
    items: [
      { href: '/repurpose', label: 'Repurpose', icon: Recycle },
      { href: '/library', label: 'Library', icon: FolderOpen },
    ],
  },
]

const SIDEBAR_COLLAPSED_KEY = 'clipflow-sidebar-collapsed'

interface SidebarProps {
  mobile?: boolean
  onClose?: () => void
}

export function Sidebar({ mobile, onClose }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
      if (stored !== null) setCollapsed(JSON.parse(stored))
    } catch {}
  }, [])

  const handleCollapse = (val: boolean) => {
    setCollapsed(val)
    try { localStorage.setItem(SIDEBAR_COLLAPSED_KEY, JSON.stringify(val)) } catch {}
  }

  return (
    <aside
      className={cn(
        'h-screen flex flex-col',
        'bg-surface border-r border-white/[0.05]',
        'transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo + close button for mobile */}
      <div className={cn('flex items-center gap-3 px-5 h-16 border-b border-white/[0.05]', collapsed && 'justify-center px-0')}>
        {mobile && (
          <button onClick={onClose} className="mr-1 text-white/40 hover:text-white flex-shrink-0">
            <X size={18} />
          </button>
        )}
        <div className="w-8 h-8 rounded-lg bg-violet flex items-center justify-center flex-shrink-0">
          <Film size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-white text-lg tracking-tight">ClipFlow</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {nav.map(section => (
          <div key={section.label} className="mb-6">
            {!collapsed && (
              <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest px-2 mb-2">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={mobile ? onClose : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      'hover:bg-white/[0.05]',
                      isActive
                        ? 'bg-violet/10 text-violet'
                        : 'text-white/50 hover:text-white/80',
                      collapsed && 'justify-center px-0 py-2.5'
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon size={16} className="flex-shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                    {!collapsed && isActive && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-violet" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings at bottom */}
      <div className="px-3 pb-4 border-t border-white/[0.05] pt-4">
        <Link
          href="/settings"
          onClick={mobile ? onClose : undefined}
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            'hover:bg-white/[0.05]',
            pathname === '/settings'
              ? 'bg-violet/10 text-violet'
              : 'text-white/50 hover:text-white/80',
            collapsed && 'justify-center px-0 py-2.5'
          )}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings size={16} className="flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => handleCollapse(!collapsed)}
        className={cn(
          'absolute -right-3 top-20 w-6 h-6 rounded-full bg-surface-raised border border-white/10',
          'items-center justify-center text-white/30 hover:text-white/60 transition-colors',
          'hidden md:flex'
        )}
      >
        <ChevronLeft size={12} className={cn('transition-transform', collapsed && 'rotate-180')} />
      </button>
    </aside>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  const items = [
    { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { href: '/content', label: 'Content', icon: FileVideo },
    { href: '/ideas', label: 'Ideas', icon: Lightbulb },
    { href: '/calendar', label: 'Calendar', icon: Calendar },
    { href: '/scripts', label: 'Scripts', icon: PenTool },
    { href: '/analytics', label: 'Stats', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-white/[0.06] md:hidden">
      <div className="flex items-center justify-around">
        {items.map(item => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 px-2 text-[9px] font-medium transition-colors min-w-[48px]',
                isActive ? 'text-violet' : 'text-white/30'
              )}
            >
              <item.icon size={16} />
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
