'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function RootPageClient() {
  const router = useRouter()

  useEffect(() => {
    let onboarded = false
    try {
      const stored = localStorage.getItem('clipflow-data')
      onboarded = !!(stored && JSON.parse(stored).settings?.onboardingComplete)
    } catch {
      // unreadable data: treat as a fresh install
    }
    router.replace(onboarded ? '/dashboard' : '/onboarding')
  }, [router])

  return null
}
