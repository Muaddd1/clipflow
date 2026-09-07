'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Gradient glow */}
        <div className="relative mx-auto mb-8">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-violet/20 to-fuchsia/20 border border-white/[0.06] flex items-center justify-center mx-auto">
            <span className="text-5xl font-bold text-white/20 font-mono">404</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-violet/10 to-fuchsia/10 blur-3xl rounded-full -z-10" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-white/40 text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard">
            <Button variant="primary" size="sm">
              <Home size={14} />
              Dashboard
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={() => history.back()}>
            <ArrowLeft size={14} />
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
