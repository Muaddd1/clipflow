'use client'

import { useState } from 'react'
import { useData } from '@/lib/data-context'
import { MetricCard, AreaChart } from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Eye, Heart, Users, FileVideo, Calendar, DollarSign,
  Plus, Lightbulb, PenTool, Handshake, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { formatNumber, formatDate, formatRelativeDate } from '@/lib/utils'
import { platformColor } from '@/lib/utils'

export default function DashboardPage() {
  const { data } = useData()

  // Stats
  const totalViews = data.content.reduce((s, c) => s + c.views, 0)
  const totalEngagement = data.content.filter(c => c.engagementRate > 0).length > 0
    ? (data.content.reduce((s, c) => s + c.engagementRate, 0) / data.content.filter(c => c.engagementRate > 0).length).toFixed(1)
    : '0'
  const totalFollowers = data.channels.reduce((s, c) => s + c.followers, 0)
  const publishedCount = data.content.filter(c => c.status === 'published').length
  const scheduledCount = data.content.filter(c => c.status === 'scheduled').length
  const totalRevenue = data.sponsors.reduce((s, sp) => sp.paymentStatus === 'paid' ? s + sp.dealValue : s, 0)

  // Pipeline counts
  const pipeline = {
    idea: data.content.filter(c => c.status === 'idea').length + data.ideas.filter(i => i.status === 'idea').length,
    developing: data.content.filter(c => c.status === 'developing').length + data.ideas.filter(i => i.status === 'developing').length,
    ready_to_script: data.ideas.filter(i => i.status === 'ready_to_script').length,
    recording: data.content.filter(c => c.status === 'recording').length,
    editing: data.content.filter(c => c.status === 'editing').length,
    scheduled: scheduledCount,
    published: publishedCount,
  }

  // Upcoming (next 7 days)
  const upcoming = data.calendar.filter(e => {
    const d = new Date(e.date)
    const now = new Date()
    const diff = (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    return diff >= 0 && diff <= 7
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Recent content
  const recentContent = [...data.content]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  // Performance data generation
  const generatePerfData = (days: number) => {
    const base = days === 7 ? 1200 : days === 30 ? 4200 : 6800
    return Array.from({ length: days }, (_, i) => {
      const trend = base + i * (days === 7 ? 80 : days === 30 ? 40 : 20)
      const noise = Math.floor(Math.random() * (days === 7 ? 300 : days === 30 ? 600 : 400))
      const spike = Math.random() > 0.85 ? Math.floor(Math.random() * 2000) : 0
      return trend + noise + spike
    })
  }

  const [perfDays, setPerfDays] = useState(30)
  const perfData = generatePerfData(perfDays)

  // Today's focus
  const todayTasks = [
    ...data.ideas.filter(i => i.priority === 'high' && i.status !== 'published').slice(0, 1),
    ...data.content.filter(c => c.status === 'recording' || c.status === 'editing').slice(0, 2),
  ]

  const quickActions = [
    { label: 'New Content', href: '/content?new=true', icon: FileVideo },
    { label: 'Add Idea', href: '/ideas?new=true', icon: Lightbulb },
    { label: 'Write Script', href: '/scripts?new=true', icon: PenTool },
    { label: 'Add Sponsor', href: '/sponsors?new=true', icon: Handshake },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Command Center</h1>
          <p className="text-white/40 text-sm mt-0.5">Here's what's happening with your content.</p>
        </div>
        <Link href="/content?new=true">
          <Button variant="primary" size="sm">
            <Plus size={14} />
            New Content
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard label="Total Views" value={formatNumber(totalViews)} change={12.4} sublabel="vs last month" />
        <MetricCard label="Engagement" value={`${totalEngagement}%`} change={2.1} sublabel="avg rate" />
        <MetricCard label="Followers" value={formatNumber(totalFollowers)} change={8.3} sublabel="across platforms" />
        <MetricCard label="Published" value={publishedCount} sublabel="pieces" />
        <MetricCard label="Scheduled" value={scheduledCount} sublabel="upcoming" />
        <MetricCard label="Revenue" value={`$${formatNumber(totalRevenue)}`} sublabel="from sponsors" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Today's Focus */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Today's Focus</h2>
            {todayTasks.length > 0 ? (
              <div className="space-y-2">
                {todayTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                    <div className="w-2 h-2 rounded-full bg-violet" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {'title' in task ? task.title : (task as any).title}
                      </p>
                      <p className="text-xs text-white/30">
                        {'platform' in task ? task.platform : (task as any).platform}
                      </p>
                    </div>
                    <Badge variant="status" status={'status' in task ? task.status : 'idea'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-white/30 mb-3">Nothing urgent for today.</p>
                <Link href="/ideas?new=true">
                  <Button variant="ghost" size="sm">
                    <Lightbulb size={14} />
                    Add an idea
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Content Pipeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white/70">Content Pipeline</h2>
              <Link href="/content" className="text-xs text-violet hover:text-violet/80 transition-colors flex items-center gap-1">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="flex items-center gap-1">
              {[
                { key: 'idea', label: 'Idea' },
                { key: 'developing', label: 'Draft' },
                { key: 'ready_to_script', label: 'Script' },
                { key: 'recording', label: 'Record' },
                { key: 'editing', label: 'Edit' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'published', label: 'Live' },
              ].map((stage, i) => (
                <div key={stage.key} className="flex-1 text-center">
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={cn(
                      'w-full rounded-lg py-2 text-sm font-bold',
                      pipeline[stage.key as keyof typeof pipeline] > 0
                        ? 'bg-violet/10 text-violet'
                        : 'bg-white/[0.03] text-white/20'
                    )}>
                      {pipeline[stage.key as keyof typeof pipeline]}
                    </div>
                    <span className="text-[10px] text-white/25 font-mono">{stage.label}</span>
                  </div>
                  {i < 6 && <div className="hidden sm:block absolute right-0 top-1/2" />}
                </div>
              ))}
            </div>
          </div>

          {/* Performance Chart */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-sm font-semibold text-white/70">Performance Overview</h2>
              <div className="flex gap-1">
                {[['7', '7D'], ['30', '30D'], ['90', '90D']].map(([days, label]) => (
                  <button
                    key={days}
                    onClick={() => setPerfDays(parseInt(days))}
                    className={cn(
                      'text-[11px] font-mono px-2.5 py-1 rounded-md transition-colors',
                      perfDays === parseInt(days) ? 'bg-violet/10 text-violet' : 'text-white/30 hover:text-white/60'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <AreaChart data={perfData} height={160} />
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Upcoming */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70">Upcoming</h2>
              <Link href="/calendar" className="text-xs text-violet hover:text-violet/80 transition-colors flex items-center gap-1">
                Calendar <ArrowRight size={12} />
              </Link>
            </div>
            {upcoming.length > 0 ? (
              <div className="space-y-2">
                {upcoming.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0">
                    <div
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: platformColor(event.platform) }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white/80 truncate">{event.title}</p>
                      <p className="text-xs text-white/30">{formatDate(event.date)}</p>
                    </div>
                    <Badge variant="platform" platform={event.platform} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/30 text-center py-6">No content scheduled this week.</p>
            )}
          </div>

          {/* Recent Content */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white/70">Recent Content</h2>
              <Link href="/content" className="text-xs text-violet hover:text-violet/80 transition-colors flex items-center gap-1">
                All <ArrowRight size={12} />
              </Link>
            </div>
            <div className="space-y-2">
              {recentContent.map(item => (
                <Link
                  key={item.id}
                  href={`/content/${item.id}`}
                  className="flex items-center gap-3 py-2 border-b border-white/[0.04] last:border-0 group"
                >
                  {item.thumbnail && (
                    <img src={item.thumbnail} alt="" className="w-10 h-7 rounded object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 group-hover:text-white truncate transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/25">{formatNumber(item.views)} views</span>
                      <Badge variant="status" status={item.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map(action => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08] transition-all group"
                >
                  <action.icon size={18} className="text-violet" />
                  <span className="text-xs text-white/50 group-hover:text-white/80 transition-colors">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | number)[]) {
  return classes.filter(Boolean).join(' ')
}
