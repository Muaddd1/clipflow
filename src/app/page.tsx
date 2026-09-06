'use client'

import { useEffect, useState } from 'react'
import { redirect } from 'next/navigation'
import { DataProvider } from '@/lib/data-context'

export default function RootPage() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clipflow-data')
      if (stored) {
        const data = JSON.parse(stored)
        if (data.settings?.onboardingComplete) {
          redirect('/dashboard')
        } else {
          redirect('/onboarding')
        }
      } else {
        redirect('/onboarding')
      }
    } catch {
      redirect('/onboarding')
    }
    setReady(true)
  }, [])

  if (!ready) return null
}
