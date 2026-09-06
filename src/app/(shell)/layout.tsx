'use client'

import { Shell } from '@/components/shell'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <Shell>{children}</Shell>
}
