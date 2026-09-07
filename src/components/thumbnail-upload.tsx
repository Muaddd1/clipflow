'use client'

import { useRef, useState } from 'react'
import { Image, Upload, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThumbnailUploadProps {
  value?: string
  onChange: (dataUrl: string | null) => void
  className?: string
}

export function ThumbnailUpload({ value, onChange, className }: ThumbnailUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setLoading(true)
    try {
      const reader = new FileReader()
      reader.onload = () => {
        onChange(reader.result as string)
        setLoading(false)
      }
      reader.onerror = () => setLoading(false)
      reader.readAsDataURL(file)
    } catch {
      setLoading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (value) {
    return (
      <div className={cn('relative group', className)}>
        <img src={value} alt="Thumbnail" className="w-full h-32 object-cover rounded-lg" />
        <button
          onClick={() => onChange(null)}
          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
        >
          <X size={12} className="text-white" />
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className="absolute inset-0 rounded-lg bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Upload size={20} className="text-white" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'relative border-2 border-dashed border-white/[0.08] rounded-lg h-32 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-violet/30 hover:bg-white/[0.02] transition-all',
        dragging && 'border-violet bg-violet/5',
        className
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      {loading ? (
        <div className="w-6 h-6 border-2 border-violet border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <Image size={20} className="text-white/20" />
          <p className="text-xs text-white/30">Click or drag to upload</p>
          <p className="text-[10px] text-white/15">JPG, PNG, WebP</p>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }}
      />
    </div>
  )
}
