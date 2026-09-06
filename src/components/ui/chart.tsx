'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { formatNumber } from '@/lib/utils'

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

interface ChartProps {
  data: number[]
  labels?: string[]
  color?: string
  height?: number
  showArea?: boolean
  className?: string
}

export function AreaChart({ data, labels, color = '#7C3AED', height = 120, showArea = true, className }: ChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || data.length === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = rect.height
    const max = Math.max(...data)
    const min = Math.min(...data)
    const range = max - min || 1
    const padding = 8
    const chartH = h - padding * 2
    const chartW = w

    ctx.clearRect(0, 0, w, h)

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)'
    ctx.lineWidth = 1
    for (let i = 0; i <= 3; i++) {
      const y = padding + (chartH / 3) * i
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Area fill
    if (showArea) {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, hexToRgba(color, 0.2))
      grad.addColorStop(1, 'rgba(0,0,0,0)')

      ctx.beginPath()
      data.forEach((val, i) => {
        const x = (i / (data.length - 1)) * chartW
        const y = padding + chartH - ((val - min) / range) * chartH
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      })
      ctx.lineTo(chartW, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fillStyle = `linear-gradient(to bottom, ${hexToRgba(color, 0.15)}, transparent)`
      ctx.fill()
    }

    // Line
    ctx.beginPath()
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * chartW
      const y = padding + chartH - ((val - min) / range) * chartH
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    // Dots
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * chartW
      const y = padding + chartH - ((val - min) / range) * chartH
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.strokeStyle = '#09090b'
      ctx.lineWidth = 2
      ctx.stroke()
    })
  }, [data, color, showArea])

  return <canvas ref={canvasRef} className={cn('w-full', className)} style={{ height }} />
}

interface BarChartProps {
  data: { label: string; value: number; color?: string }[]
  height?: number
  className?: string
}

export function BarChart({ data, height = 120, className }: BarChartProps) {
  const max = Math.max(...data.map(d => d.value))

  return (
    <div className={cn('flex items-end gap-2', className)} style={{ height }}>
      {data.map((item, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full rounded-t-md transition-all"
            style={{
              height: `${(item.value / max) * (height - 20)}px`,
              backgroundColor: item.color || '#7C3AED',
            }}
          />
          <span className="text-[10px] text-white/30 font-mono truncate w-full text-center">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
}

interface MetricCardProps {
  label: string
  value: string | number
  change?: number
  sublabel?: string
  className?: string
}

export function MetricCard({ label, value, change, sublabel, className }: MetricCardProps) {
  return (
    <div className={cn('rounded-xl border border-white/[0.06] bg-white/[0.02] p-5', className)}>
      <p className="text-xs font-mono text-white/30 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? formatNumber(value) : value}</p>
      {(change !== undefined || sublabel) && (
        <div className="flex items-center gap-2 mt-1">
          {change !== undefined && (
            <span className={`text-xs font-mono ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
          )}
          {sublabel && <span className="text-xs text-white/20">{sublabel}</span>}
        </div>
      )}
    </div>
  )
}
