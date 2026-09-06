'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Film, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useData } from '@/lib/data-context'
import { toast } from 'sonner'

const platforms = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'linkedin', label: 'LinkedIn' },
]

const categories = [
  'Tech', 'Productivity', 'Business', 'AI', 'Education',
  'Entertainment', 'Lifestyle', 'Personal', 'Tutorial', 'Opinion',
]

const steps = [
  { num: 1, label: 'Welcome' },
  { num: 2, label: 'Platforms' },
  { num: 3, label: 'Categories' },
  { num: 4, label: 'Goal' },
  { num: 5, label: 'First Idea' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { data, addIdea, updateSettings, completeOnboarding } = useData()
  const [step, setStep] = useState(1)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['youtube', 'tiktok'])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Tech', 'AI'])
  const [weeklyGoal, setWeeklyGoal] = useState(3)
  const [firstIdea, setFirstIdea] = useState({ title: '', hook: '' })

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  const toggleCategory = (c: string) => {
    setSelectedCategories(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  const handleFinish = () => {
    updateSettings({
      preferences: {
        ...data.settings.preferences,
        platforms: selectedPlatforms as any,
        categories: selectedCategories,
        weeklyGoal,
      },
    })
    if (firstIdea.title.trim()) {
      addIdea({
        title: firstIdea.title,
        hook: firstIdea.hook,
        description: '',
        platform: selectedPlatforms[0] as any || 'youtube',
        category: selectedCategories[0] || 'Tech',
        tags: selectedCategories,
        viralScore: 5,
        status: 'idea',
        priority: 'medium',
        notes: '',
      })
    }
    completeOnboarding()
    toast.success('Welcome to ClipFlow! Let\'s start creating.')
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-2xl bg-violet/10 border border-violet/20 flex items-center justify-center mx-auto mb-5">
            <Film size={24} className="text-violet" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ClipFlow</h1>
          <p className="text-white/40 text-sm">The operating system for your content business.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {steps.map(s => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-mono font-medium transition-all',
                step >= s.num ? 'bg-violet text-white' : 'bg-white/[0.05] text-white/30'
              )}>
                {step > s.num ? <Check size={12} /> : s.num}
              </div>
              {s.num < steps.length && (
                <div className={cn('w-8 h-px', step > s.num ? 'bg-violet' : 'bg-white/[0.06]')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-surface-raised border border-white/[0.06] rounded-2xl p-8">
          {step === 1 && (
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-semibold text-white">Welcome, creator.</h2>
              <p className="text-white/40 text-sm leading-relaxed">
                ClipFlow helps you manage your entire content business — from the first idea to the final analytics.
                Let's set it up in 2 minutes.
              </p>
              <Button variant="primary" className="w-full mt-4" onClick={() => setStep(2)}>
                Get Started
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Where do you create?</h2>
              <p className="text-white/40 text-sm">Select all platforms you actively post on.</p>
              <div className="grid grid-cols-2 gap-2">
                {platforms.map(p => (
                  <button
                    key={p.value}
                    onClick={() => togglePlatform(p.value)}
                    className={cn(
                      'flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all text-left',
                      selectedPlatforms.includes(p.value)
                        ? 'border-violet bg-violet/10 text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80'
                    )}
                  >
                    <div className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center',
                      selectedPlatforms.includes(p.value)
                        ? 'bg-violet border-violet'
                        : 'border-white/20'
                    )}>
                      {selectedPlatforms.includes(p.value) && <Check size={10} className="text-white" />}
                    </div>
                    {p.label}
                  </button>
                ))}
              </div>
              <Button variant="primary" className="w-full mt-4" onClick={() => setStep(3)} disabled={selectedPlatforms.length === 0}>
                Continue
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">What do you create about?</h2>
              <p className="text-white/40 text-sm">Pick your content categories.</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      'px-4 py-2 rounded-lg border text-sm font-medium transition-all',
                      selectedCategories.includes(c)
                        ? 'border-violet bg-violet/10 text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-white/50 hover:text-white/80'
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <Button variant="primary" className="w-full mt-4" onClick={() => setStep(4)} disabled={selectedCategories.length === 0}>
                Continue
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Set a weekly goal.</h2>
              <p className="text-white/40 text-sm">How many pieces of content do you aim to publish per week?</p>
              <div className="flex items-center gap-4 justify-center py-6">
                <button
                  onClick={() => setWeeklyGoal(Math.max(1, weeklyGoal - 1))}
                  className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white text-xl font-light transition-colors"
                >
                  −
                </button>
                <div className="w-24 text-center">
                  <p className="text-5xl font-bold text-white">{weeklyGoal}</p>
                  <p className="text-xs text-white/30 mt-1">per week</p>
                </div>
                <button
                  onClick={() => setWeeklyGoal(weeklyGoal + 1)}
                  className="w-12 h-12 rounded-xl bg-white/[0.05] border border-white/[0.06] text-white/60 hover:text-white text-xl font-light transition-colors"
                >
                  +
                </button>
              </div>
              <Button variant="primary" className="w-full mt-4" onClick={() => setStep(5)}>
                Continue
              </Button>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">One last thing.</h2>
              <p className="text-white/40 text-sm">Have an idea brewing? Capture it now and start with momentum.</p>
              <Input
                placeholder="Your content idea..."
                value={firstIdea.title}
                onChange={e => setFirstIdea(prev => ({ ...prev, title: e.target.value }))}
              />
              <Textarea
                placeholder="The hook — what makes people stop scrolling? (optional)"
                value={firstIdea.hook}
                onChange={e => setFirstIdea(prev => ({ ...prev, hook: e.target.value }))}
                rows={2}
              />
              <Button variant="primary" className="w-full mt-4" onClick={handleFinish}>
                Launch ClipFlow →
              </Button>
            </div>
          )}

          {/* Back */}
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="text-xs text-white/30 hover:text-white/50 mt-4 transition-colors"
            >
              Back
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
