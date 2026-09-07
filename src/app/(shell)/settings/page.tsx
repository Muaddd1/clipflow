'use client'

import { useState, useEffect } from 'react'
import { useData } from '@/lib/data-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Settings, User, Sliders, Palette, Bell, Database, ChevronRight, Check, Sparkles, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { Platform, AppSettings } from '@/lib/types'

const platformOptions = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const categoryOptions = [
  { value: 'Education', label: 'Education' },
  { value: 'Entertainment', label: 'Entertainment' },
  { value: 'Lifestyle', label: 'Lifestyle' },
  { value: 'Tech', label: 'Tech' },
  { value: 'Business', label: 'Business' },
  { value: 'Gaming', label: 'Gaming' },
  { value: 'Music', label: 'Music' },
  { value: 'Sports', label: 'Sports' },
  { value: 'News', label: 'News' },
  { value: 'Other', label: 'Other' },
]

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'preferences', label: 'Creator', icon: Sliders },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'ai', label: 'AI', icon: Sparkles },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'data', label: 'Data', icon: Database },
]

export default function SettingsPage() {
  const { data, updateSettings, clearData, exportData } = useData()
  const [tab, setTab] = useState('profile')
  const [clearOpen, setClearOpen] = useState(false)
  const settings = data.settings

  const [profile, setProfile] = useState({
    name: settings.profile.name,
    handle: settings.profile.handle,
    bio: settings.profile.bio,
    avatar: settings.profile.avatar,
  })

  const [prefs, setPrefs] = useState({
    platforms: settings.preferences.platforms,
    categories: settings.preferences.categories,
    weeklyGoal: settings.preferences.weeklyGoal,
  })

  const [notifications, setNotifications] = useState({
    email: settings.notifications.email,
    push: settings.notifications.push,
    inApp: settings.notifications.inApp,
    weeklyDigest: settings.notifications.weeklyDigest,
  })

  const [aiApiKey, setAiApiKey] = useState('')
  const [aiOrgId, setAiOrgId] = useState('')
  const [aiModel, setAiModel] = useState('openai/gpt-oss-20b')
  const [aiDefaultTone, setAiDefaultTone] = useState('Casual')
  const [showApiKey, setShowApiKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [replicateKey, setReplicateKey] = useState('')
  const [showReplicateKey, setShowReplicateKey] = useState(false)
  const [testingReplicate, setTestingReplicate] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAiApiKey(localStorage.getItem('clipflow-groq-key') || '')
      setAiOrgId(localStorage.getItem('clipflow-groq-org') || '')
      setAiModel(localStorage.getItem('clipflow-ai-model') || 'openai/gpt-oss-20b')
      setAiDefaultTone(localStorage.getItem('clipflow-ai-tone') || 'Casual')
      setReplicateKey(localStorage.getItem('clipflow-replicate-key') || '')
    }
  }, [])

  const handleSaveApiKey = () => {
    if (typeof window !== 'undefined') {
      if (aiApiKey.trim()) {
        localStorage.setItem('clipflow-groq-key', aiApiKey.trim())
      } else {
        localStorage.removeItem('clipflow-groq-key')
      }
      if (aiOrgId.trim()) {
        localStorage.setItem('clipflow-groq-org', aiOrgId.trim())
      } else {
        localStorage.removeItem('clipflow-groq-org')
      }
      localStorage.setItem('clipflow-ai-model', aiModel)
      localStorage.setItem('clipflow-ai-tone', aiDefaultTone)
      if (replicateKey.trim()) {
        localStorage.setItem('clipflow-replicate-key', replicateKey.trim())
      } else {
        localStorage.removeItem('clipflow-replicate-key')
      }
    }
    toast.success('AI settings saved')
  }

  const handleTestGroq = async () => {
    setTestingKey(true)
    try {
      const key = aiApiKey.trim()
      const org = aiOrgId.trim()
      if (!key) {
        toast.error('Please enter a Groq API key first')
        setTestingKey(false)
        return
      }
      if (key) localStorage.setItem('clipflow-groq-key', key)
      if (org) localStorage.setItem('clipflow-groq-org', org)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key,
          topic: 'test connection',
          platform: 'youtube',
          contentType: 'Tutorial',
          tone: 'Casual',
          duration: '1-3 min',
          model: aiModel,
        }),
      })
      const result = await response.json()
      if (response.ok) {
        toast.success('Groq connection successful!')
      } else {
        toast.error(result.error || 'Connection failed. Check your API key.')
      }
    } catch {
      toast.error('Connection failed. Check your API key.')
    } finally {
      setTestingKey(false)
    }
  }

  const handleTestReplicate = async () => {
    setTestingReplicate(true)
    try {
      const key = replicateKey.trim()
      if (!key) {
        toast.error('Please enter a Replicate API key first')
        setTestingReplicate(false)
        return
      }
      localStorage.setItem('clipflow-replicate-key', key)
      const response = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, test: true }),
      })
      const result = await response.json()
      if (response.ok) {
        toast.success('Replicate connection successful!')
      } else {
        toast.error(result.error || 'Connection failed.')
      }
    } catch {
      toast.error('Connection failed. Check your API key.')
    } finally {
      setTestingReplicate(false)
    }
  }

  useEffect(() => {
    setProfile({ name: settings.profile.name, handle: settings.profile.handle, bio: settings.profile.bio, avatar: settings.profile.avatar })
    setPrefs({ platforms: settings.preferences.platforms, categories: settings.preferences.categories, weeklyGoal: settings.preferences.weeklyGoal })
    setNotifications({ email: settings.notifications.email, push: settings.notifications.push, inApp: settings.notifications.inApp, weeklyDigest: settings.notifications.weeklyDigest })
  }, [settings])

  const handleSaveProfile = () => {
    updateSettings({ profile })
    toast.success('Profile saved')
  }

  const handleSavePrefs = () => {
    updateSettings({ preferences: { platforms: prefs.platforms, categories: prefs.categories, weeklyGoal: prefs.weeklyGoal } })
    toast.success('Preferences saved')
  }

  const handleTogglePlatform = (p: Platform) => {
    const current = prefs.platforms
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p]
    setPrefs(prev => ({ ...prev, platforms: next as Platform[] }))
  }

  const handleToggleCategory = (c: string) => {
    const current = prefs.categories
    const next = current.includes(c) ? current.filter(x => x !== c) : [...current, c]
    setPrefs(prev => ({ ...prev, categories: next }))
  }

  const handleToggleNotif = (key: keyof typeof notifications) => {
    setNotifications(prev => {
      const next = { ...prev, [key]: !prev[key] }
      updateSettings({ notifications: next })
      return next
    })
    toast.success('Notification setting updated')
  }

  const handleExportCsv = () => {
    const headers = ['Title', 'Platform', 'Status', 'Views', 'Likes', 'Comments', 'Shares', 'Engagement', 'Revenue', 'Tags', 'Created']
    const rows = data.content.map(c => [
      `"${c.title}"`, c.platform, c.status, c.views, c.likes, c.comments, c.shares, c.engagementRate, c.revenue,
      `"${(c.tags || []).join(', ')}"`, c.createdAt,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipflow-content-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Content exported as CSV')
  }

  const handleExport = () => {
    const json = exportData()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `clipflow-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Data exported')
  }

  const handleClear = () => {
    clearData()
    toast.success('All data cleared')
    setClearOpen(false)
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/40 text-sm mt-0.5">Manage your account and preferences</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar tabs */}
        <div className="w-48 shrink-0 space-y-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left',
                tab === t.id ? 'bg-white/[0.06] text-white' : 'text-white/40 hover:text-white/70 hover:bg-white/[0.03]')}>
              <t.icon size={15} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 max-w-xl space-y-6">
          {/* Profile */}
          {tab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-violet/20 flex items-center justify-center text-lg font-bold text-violet">
                  {profile.avatar ? <img src={profile.avatar} className="w-full h-full rounded-full object-cover" alt="avatar" /> : getInitials(profile.name || 'U')}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{profile.name || 'Your Name'}</p>
                  <p className="text-xs text-white/30">@{profile.handle || 'handle'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input label="Display Name" value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Your name..." />
                <Input label="Handle" value={profile.handle} onChange={e => setProfile(p => ({ ...p, handle: e.target.value }))} placeholder="username" />
                <Input label="Avatar URL" value={profile.avatar} onChange={e => setProfile(p => ({ ...p, avatar: e.target.value }))} placeholder="https://..." />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Bio</label>
                  <textarea value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} rows={3} placeholder="Tell the world who you are..."
                    className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 resize-none" />
                </div>
              </div>
              <Button variant="primary" onClick={handleSaveProfile}>Save Profile</Button>
            </div>
          )}

          {/* Creator Preferences */}
          {tab === 'preferences' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Platforms</label>
                <div className="flex flex-wrap gap-2">
                  {platformOptions.map(p => (
                    <button key={p.value} onClick={() => handleTogglePlatform(p.value as Platform)}
                      className={cn('px-3 py-2 rounded-lg text-sm border transition-colors',
                        prefs.platforms.includes(p.value as Platform)
                          ? 'bg-violet/10 border-violet/30 text-violet'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70')}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Content Categories</label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map(c => (
                    <button key={c.value} onClick={() => handleToggleCategory(c.value)}
                      className={cn('px-3 py-2 rounded-lg text-sm border transition-colors',
                        prefs.categories.includes(c.value)
                          ? 'bg-violet/10 border-violet/30 text-violet'
                          : 'bg-white/[0.03] border-white/[0.06] text-white/40 hover:text-white/70')}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Weekly Publishing Goal</label>
                <div className="flex items-center gap-4">
                  <input type="number" min={1} max={50} value={prefs.weeklyGoal} onChange={e => setPrefs(p => ({ ...p, weeklyGoal: +e.target.value }))}
                    className="w-20 bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white text-center focus:outline-none focus:border-violet/50" />
                  <span className="text-sm text-white/30">pieces per week</span>
                </div>
              </div>

              <Button variant="primary" onClick={handleSavePrefs}>Save Preferences</Button>
            </div>
          )}

          {/* Appearance */}
          {tab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {([['dark', 'Dark', 'bg-zinc-900 border-white/10'], ['light', 'Light', 'bg-white border-black/10']] as const).map(([v, label, cls]) => (
                    <button
                      key={v}
                      onClick={() => {
                        updateSettings({ theme: v })
                        toast.success(`${label} theme applied`)
                      }}
                      className={cn('h-16 rounded-xl border-2 transition-all flex items-center justify-center text-sm font-medium',
                        cls, settings.theme === v ? 'ring-2 ring-violet' : '', 'text-white/70 hover:text-white')}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-white/70 mb-3 block">Accent Color</label>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet flex items-center justify-center">
                    <Check size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70">Violet (#7C3AED)</p>
                    <p className="text-xs text-white/30">ClipFlow signature color</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI */}
          {tab === 'ai' && (
            <div className="space-y-5">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                <div>
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5 block">Groq API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showApiKey ? 'text' : 'password'}
                        value={aiApiKey}
                        onChange={e => setAiApiKey(e.target.value)}
                        placeholder="gsk_..."
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 pr-10"
                      />
                      <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleTestGroq} disabled={testingKey || !aiApiKey.trim()}>
                      {testingKey ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-white/20 mt-1.5">Free API key from console.groq.com — no credit card needed. Used for script generation.</p>
                </div>

                <div>
                  <label className="text-xs font-mono text-white/40 uppercase tracking-wider mb-1.5 block">Replicate API Key</label>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showReplicateKey ? 'text' : 'password'}
                        value={replicateKey}
                        onChange={e => setReplicateKey(e.target.value)}
                        placeholder="r8_..."
                        className="w-full bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet/50 pr-10"
                      />
                      <button onClick={() => setShowReplicateKey(!showReplicateKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                        {showReplicateKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <Button variant="secondary" size="sm" onClick={handleTestReplicate} disabled={testingReplicate || !replicateKey.trim()}>
                      {testingReplicate ? 'Testing...' : 'Test'}
                    </Button>
                  </div>
                  <p className="text-xs text-white/20 mt-1.5">Free tier at replicate.com — used for AI thumbnail generation. <span className="text-violet">Flux Kontext</span> model creates the thumbnails.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="AI Model"
                    value={aiModel}
                    onValueChange={setAiModel}
                    options={[
                      { value: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B (Fast)' },
                      { value: 'openai/gpt-oss-120b', label: 'GPT-OSS 120B (Best)' },
                      { value: 'qwen/qwen3.6-27b', label: 'Qwen 3.6 27B' },
                    ]}
                    id="ai-model"
                  />
                  <Select
                    label="Default Tone"
                    value={aiDefaultTone}
                    onValueChange={setAiDefaultTone}
                    options={[
                      { value: 'Professional', label: 'Professional' },
                      { value: 'Casual', label: 'Casual & Friendly' },
                      { value: 'Provocative', label: 'Provocative / Edgy' },
                      { value: 'Educational', label: 'Educational' },
                      { value: 'Entertaining', label: 'Entertaining / Fun' },
                    ]}
                    id="ai-tone-default"
                  />
                </div>

                <Button variant="primary" onClick={handleSaveApiKey}>Save AI Settings</Button>
              </div>

              <div className="rounded-xl border border-violet/10 bg-violet/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-violet" />
                  <p className="text-sm font-medium text-white/70">AI Features</p>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">
                  Groq API powers <span className="text-violet">script generation</span>. Replicate powers <span className="text-violet">thumbnail generation</span> using Flux Kontext — enter a prompt describing your thumbnail style, and AI creates it in seconds.
                </p>
              </div>
            </div>
          )}

          {/* Notifications */}
          {tab === 'notifications' && (
            <div className="space-y-4">
              {[
                { key: 'inApp', label: 'In-app notifications', desc: 'Get notified inside ClipFlow' },
                { key: 'email', label: 'Email digest', desc: 'Weekly summary of your content performance' },
                { key: 'push', label: 'Push notifications', desc: 'Browser notifications for real-time updates' },
                { key: 'weeklyDigest', label: 'Weekly digest', desc: 'Curated insights and recommendations' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div>
                    <p className="text-sm font-medium text-white/70">{n.label}</p>
                    <p className="text-xs text-white/30 mt-0.5">{n.desc}</p>
                  </div>
                  <button onClick={() => handleToggleNotif(n.key as keyof typeof notifications)}
                    className={cn('w-10 h-6 rounded-full transition-colors relative', notifications[n.key as keyof typeof notifications] ? 'bg-violet' : 'bg-white/[0.1]')}>
                    <div className={cn('w-4 h-4 rounded-full bg-white/80 absolute top-1 transition-all', notifications[n.key as keyof typeof notifications] ? 'translate-x-5' : 'translate-x-1')} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Data */}
          {tab === 'data' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/70">Export Content Log</p>
                    <p className="text-xs text-white/30 mt-0.5">Download content as CSV spreadsheet</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleExportCsv}>Export CSV</Button>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                  <div>
                    <p className="text-sm font-medium text-white/70">Full Backup</p>
                    <p className="text-xs text-white/30 mt-0.5">Download all data as JSON</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleExport}>Export JSON</Button>
                </div>
              </div>

              <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-red-400/80">Clear All Data</p>
                    <p className="text-xs text-red-400/30 mt-0.5">Permanently delete all content, ideas, scripts, and sponsors</p>
                  </div>
                  <Button variant="destructive" size="sm" onClick={() => setClearOpen(true)}>Clear Data</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog open={clearOpen} onOpenChange={setClearOpen} title="Clear all data?" description="This will permanently delete all your content, ideas, scripts, sponsors, and settings. This cannot be undone." confirmLabel="Clear Everything" destructive onConfirm={handleClear} />
    </div>
  )
}
