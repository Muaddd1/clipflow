import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toString()
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(n)
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatRelativeDate(date: string): string {
  const now = new Date()
  const d = new Date(date)
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  return formatDate(date)
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export function platformColor(platform: string): string {
  const colors: Record<string, string> = {
    youtube: '#ff0033',
    tiktok: '#ff0050',
    instagram: '#e1306c',
    x: '#ffffff',
    linkedin: '#0a66c2',
  }
  return colors[platform] || '#7C3AED'
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    idea: '#6b7280',
    developing: '#f59e0b',
    ready_to_script: '#3b82f6',
    recording: '#8b5cf6',
    editing: '#06b6d4',
    scheduled: '#f97316',
    published: '#22c55e',
    contacted: '#6b7280',
    negotiating: '#f59e0b',
    approved: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#22c55e',
    paid: '#22c55e',
  }
  return colors[status] || '#6b7280'
}

export function priorityColor(priority: string): string {
  if (priority === 'high') return '#ef4444'
  if (priority === 'medium') return '#f59e0b'
  return '#6b7280'
}

export function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    idea: 'Idea',
    developing: 'Developing',
    ready_to_script: 'Ready to Script',
    recording: 'Recording',
    editing: 'Editing',
    scheduled: 'Scheduled',
    published: 'Published',
    contacted: 'Contacted',
    negotiating: 'Negotiating',
    approved: 'Approved',
    in_progress: 'In Progress',
    completed: 'Completed',
    paid: 'Paid',
  }
  return labels[status] || status
}

export function platformLabel(platform: string): string {
  const labels: Record<string, string> = {
    youtube: 'YouTube',
    tiktok: 'TikTok',
    instagram: 'Instagram',
    x: 'X',
    linkedin: 'LinkedIn',
  }
  return labels[platform] || platform
}
