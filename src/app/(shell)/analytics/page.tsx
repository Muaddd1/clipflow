'use client'

import { useState, useEffect } from 'react'
import { useData } from '@/lib/data-context'
import { Badge } from '@/components/ui/badge'
import { Eye, TrendingUp, Users, DollarSign, TrendingDown, BarChart2, ThumbsUp, Calendar } from 'lucide-react'
import { formatNumber, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const periods = [
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: 'all', label: 'All' },
]

// Generate 30-day mock analytics
function generateAnalytics() {
  const days = []
  let views = 12000
  let followers = 2200
  for (let i = 29; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const spike = Math.random() > 0.8
    const baseViews = spike ? Math.floor(Math.random() * 3000) + 1000 : Math.floor(Math.random() * 800) + 200
    views += baseViews
    followers += Math.floor(Math.random() * 40)
    days.push({
      date: date.toISOString().split('T')[0],
      views: views,
      newViews: baseViews,
      engagement: Math.floor(baseViews * (Math.random() * 0.08 + 0.02)),
      followers,
      newFollowers: Math.floor(Math.random() * 40),
    })
  }
  return days
}

export default function AnalyticsPage() {
  const { data } = useData()
  const [period, setPeriod] = useState('30')
  const [analytics, setAnalytics] = useState<ReturnType<typeof generateAnalytics>>([])

  useEffect(() => {
    setAnalytics(generateAnalytics())
  }, [])

  const filtered = period === 'all' ? analytics : analytics.slice(-parseInt(period))

  const totalViews = filtered.reduce((s, d) => s + d.newViews, 0)
  const totalEngagement = filtered.reduce((s, d) => s + d.engagement, 0)
  const avgEngagement = totalViews > 0 ? ((totalEngagement / totalViews) * 100).toFixed(1) : '0'
  const latestFollowers = filtered[filtered.length - 1]?.followers || 0
  const followerGrowth = filtered.length > 1 ? filtered[filtered.length - 1].followers - filtered[0].followers : 0
  const totalRevenue = data.content.reduce((s, c) => s + (c.revenue || 0), 0)

  const maxViews = filtered.length > 0 ? Math.max(...filtered.map(d => d.newViews)) : 1

  // Platform breakdown
  const platformCounts: Record<string, number> = {}
  data.content.forEach(c => { platformCounts[c.platform] = (platformCounts[c.platform] || 0) + 1 })

  // Top content by views
  const topContent = [...data.content]
    .filter(c => c.views > 0)
    .sort((a, b) => b.views - a.views)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-white/40 text-sm mt-0.5">Track your growth across all platforms</p>
        </div>
        <div className="flex items-center gap-1 bg-white/[0.03] border border-white/[0.06] rounded-lg p-1">
          {periods.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', period === p.value ? 'bg-white/[0.06] text-white' : 'text-white/30 hover:text-white/60')}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: Eye, label: 'Total Views', value: formatNumber(totalViews), sub: `+${formatNumber(filtered[filtered.length - 1]?.newViews || 0)} this period` },
          { icon: TrendingUp, label: 'Engagement', value: `${avgEngagement}%`, sub: `${formatNumber(totalEngagement)} interactions` },
          { icon: Users, label: 'Followers', value: formatNumber(latestFollowers), sub: `+${formatNumber(followerGrowth)} this period` },
          { icon: DollarSign, label: 'Revenue', value: `$${formatNumber(totalRevenue)}`, sub: `${data.content.filter(c => c.revenue > 0).length} monetized` },
        ].map(stat => (
          <div key={stat.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div className="flex items-center gap-2 mb-3">
              <stat.icon size={14} className="text-white/30" />
              <span className="text-xs text-white/30">{stat.label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-white/25 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-sm font-semibold text-white/70">Views Over Time</h3>
          <span className="text-xs text-white/25">{filtered.length} days</span>
        </div>
        <div className="h-48 flex items-end gap-1">
          {filtered.map((day, i) => {
            const height = maxViews > 0 ? (day.newViews / maxViews) * 100 : 0
            const isLast = i === filtered.length - 1
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                <div
                  className={cn('w-full rounded-sm transition-all', isLast ? 'bg-violet' : 'bg-white/[0.08] hover:bg-white/[0.15]')}
                  style={{ height: `${Math.max(height, 2)}%` }}
                />
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 border border-white/10 rounded px-2 py-1 text-[10px] text-white/70 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {formatNumber(day.newViews)} views
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex justify-between mt-3 text-[10px] text-white/20">
          <span>{filtered[0]?.date}</span>
          <span>{filtered[filtered.length - 1]?.date}</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Platform Breakdown */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">Platform Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(platformCounts).map(([platform, count]) => {
              const pct = data.content.length > 0 ? (count / data.content.length) * 100 : 0
              return (
                <div key={platform} className="flex items-center gap-3">
                  <Badge variant="platform" platform={platform as any} />
                  <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-violet" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-white/30 w-6 text-right">{count}</span>
                </div>
              )
            })}
            {Object.keys(platformCounts).length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">No content yet</p>
            )}
          </div>
        </div>

        {/* Top Content */}
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <h3 className="text-sm font-semibold text-white/70 mb-4">Top Performing Content</h3>
          <div className="space-y-3">
            {topContent.map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="text-xs font-mono text-white/20 w-4">{i + 1}</span>
                <Badge variant="platform" platform={c.platform} />
                <p className="flex-1 text-sm text-white/60 truncate">{c.title}</p>
                <span className="text-xs font-mono text-white/40">{formatNumber(c.views)}</span>
              </div>
            ))}
            {topContent.length === 0 && (
              <p className="text-sm text-white/30 text-center py-4">No published content yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Engagement over time */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h3 className="text-sm font-semibold text-white/70 mb-4">Engagement Rate Trend</h3>
        <div className="flex items-center gap-4">
          {filtered.filter((_, i) => i % Math.ceil(filtered.length / 12) === 0).map(day => {
            const rate = day.views > 0 ? ((day.engagement / day.views) * 100).toFixed(1) : '0'
            return (
              <div key={day.date} className="flex-1 text-center">
                <p className="text-lg font-bold text-white">{rate}%</p>
                <p className="text-[10px] text-white/20 mt-1">{day.date.slice(5)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Real Content Performance */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 size={14} className="text-violet" />
          <h3 className="text-sm font-semibold text-white/70">Content Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left py-2 px-3 text-[10px] font-mono text-white/20 uppercase">#</th>
                <th className="text-left py-2 px-3 text-[10px] font-mono text-white/20 uppercase">Content</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase">Platform</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase">Status</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase text-right">Views</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase text-right">Likes</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase text-right">Eng%</th>
                <th className="py-2 px-3 text-[10px] font-mono text-white/20 uppercase text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {[...data.content]
                .filter(c => c.views > 0 || c.status === 'published')
                .sort((a, b) => b.views - a.views)
                .slice(0, 10)
                .map((c, i) => (
                <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-xs text-white/20">{i + 1}</td>
                  <td className="py-2.5 px-3"><p className="text-sm text-white/70 truncate max-w-xs">{c.title}</p></td>
                  <td className="py-2.5 px-3"><Badge variant="platform" platform={c.platform} /></td>
                  <td className="py-2.5 px-3"><Badge variant="status" status={c.status} /></td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-white/60">{formatNumber(c.views)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-sm text-white/60">{formatNumber(c.likes)}</td>
                  <td className="py-2.5 px-3 text-right">
                    <span className={cn(
                      'text-xs font-mono',
                      c.engagementRate >= 5 ? 'text-green-400' : c.engagementRate >= 2 ? 'text-amber-400' : 'text-white/30'
                    )}>
                      {c.engagementRate > 0 ? `${c.engagementRate}%` : '—'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right text-xs text-white/20">{formatDate(c.updatedAt)}</td>
                </tr>
              ))}
              {data.content.filter(c => c.views > 0).length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-sm text-white/30">No performance data yet — publish some content!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Content by status */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {(['idea','developing','ready_to_script','recording','editing','scheduled','published'] as const).map(status => {
          const count = data.content.filter(c => c.status === status).length
          const pct = data.content.length > 0 ? Math.round((count / data.content.length) * 100) : 0
          return (
            <div key={status} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
              <p className="text-2xl font-bold text-white mb-1">{count}</p>
              <p className="text-xs text-white/30 capitalize mb-2">{status.replace('_', ' ')}</p>
              <div className="w-full h-1 bg-white/[0.04] rounded-full overflow-hidden">
                <div className="h-full bg-violet rounded-full" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
