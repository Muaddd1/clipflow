'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { seedData } from './seed'
import type { AppData, Content, Idea, Script, Sponsor, CalendarEvent, LibraryItem, AppSettings, Channel } from './types'
import { uid } from './utils'

const STORAGE_KEY = 'clipflow-data'

interface DataContextValue {
  data: AppData
  // Channels
  getChannel: (id: string) => Channel | undefined
  // Content
  addContent: (content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateContent: (id: string, updates: Partial<Content>) => void
  deleteContent: (id: string) => void
  getContent: (id: string) => Content | undefined
  // Ideas
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  deleteIdea: (id: string) => void
  getIdea: (id: string) => Idea | undefined
  // Scripts
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => void
  updateScript: (id: string, updates: Partial<Script>) => void
  deleteScript: (id: string) => void
  getScript: (id: string) => Script | undefined
  // Sponsors
  addSponsor: (sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateSponsor: (id: string, updates: Partial<Sponsor>) => void
  deleteSponsor: (id: string) => void
  getSponsor: (id: string) => Sponsor | undefined
  // Calendar
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => void
  updateCalendarEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteCalendarEvent: (id: string) => void
  // Library
  addLibraryItem: (item: Omit<LibraryItem, 'id' | 'createdAt'>) => void
  updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => void
  deleteLibraryItem: (id: string) => void
  // Settings
  updateSettings: (updates: Partial<AppSettings>) => void
  // Onboarding
  completeOnboarding: () => void
  // Data
  clearData: () => void
  exportData: () => string
}

// Default no-op context used during SSR/prerender when provider isn't mounted yet
const defaultContextValue: DataContextValue = {
  data: seedData,
  getChannel: () => undefined,
  addContent: () => {}, updateContent: () => {}, deleteContent: () => {}, getContent: () => undefined,
  addIdea: () => {}, updateIdea: () => {}, deleteIdea: () => {}, getIdea: () => undefined,
  addScript: () => {}, updateScript: () => {}, deleteScript: () => {}, getScript: () => undefined,
  addSponsor: () => {}, updateSponsor: () => {}, deleteSponsor: () => {}, getSponsor: () => undefined,
  addCalendarEvent: () => {}, updateCalendarEvent: () => {}, deleteCalendarEvent: () => {},
  addLibraryItem: () => {}, updateLibraryItem: () => {}, deleteLibraryItem: () => {},
  updateSettings: () => {}, completeOnboarding: () => {}, clearData: () => {}, exportData: () => '{}',
}

const DataContext = createContext<DataContextValue>(defaultContextValue)

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(seedData)

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AppData
        // Merge with seed to ensure new fields exist
        const merged = { ...seedData, ...parsed }
        // Auto-refresh trending ideas daily
        const oneDayMs = 24 * 60 * 60 * 1000
        const now = new Date()
        const nowStr = now.toISOString()
        const refreshedIdeas = merged.ideas.map(idea => {
          if (idea.trending && idea.lastRefreshed) {
            const ageMs = now.getTime() - new Date(idea.lastRefreshed).getTime()
            if (ageMs > oneDayMs) {
              return { ...idea, lastRefreshed: nowStr }
            }
          }
          return idea
        })
        setData({ ...merged, ideas: refreshedIdeas })
      }
    } catch {
      // Use seed data on error
      setData(seedData)
    }
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch {
      // Ignore storage errors
    }
  }, [data])

  // --- Channels ---
  const getChannel = useCallback((id: string) => data.channels.find(c => c.id === id), [data])

  // --- Content ---
  const addContent = useCallback((content: Omit<Content, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      content: [{ ...content, id: uid(), createdAt: now, updatedAt: now }, ...d.content],
    }))
  }, [])

  const updateContent = useCallback((id: string, updates: Partial<Content>) => {
    setData(d => ({
      ...d,
      content: d.content.map(c => c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c),
    }))
  }, [])

  const deleteContent = useCallback((id: string) => {
    setData(d => ({ ...d, content: d.content.filter(c => c.id !== id) }))
  }, [])

  const getContent = useCallback((id: string) => data.content.find(c => c.id === id), [data])

  // --- Ideas ---
  const addIdea = useCallback((idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      ideas: [{ ...idea, id: uid(), createdAt: now, updatedAt: now }, ...d.ideas],
    }))
  }, [])

  const updateIdea = useCallback((id: string, updates: Partial<Idea>) => {
    setData(d => ({
      ...d,
      ideas: d.ideas.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i),
    }))
  }, [])

  const deleteIdea = useCallback((id: string) => {
    setData(d => ({ ...d, ideas: d.ideas.filter(i => i.id !== id) }))
  }, [])

  const getIdea = useCallback((id: string) => data.ideas.find(i => i.id === id), [data])

  // --- Scripts ---
  const addScript = useCallback((script: Omit<Script, 'id' | 'createdAt' | 'updatedAt' | 'versions'>) => {
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      scripts: [{ ...script, id: uid(), createdAt: now, updatedAt: now, versions: [] }, ...d.scripts],
    }))
  }, [])

  const updateScript = useCallback((id: string, updates: Partial<Script>) => {
    setData(d => ({
      ...d,
      scripts: d.scripts.map(s => {
        if (s.id !== id) return s
        const updated = { ...s, ...updates, updatedAt: new Date().toISOString() }
        // Save version
        const version = { id: uid(), content: updated, savedAt: new Date().toISOString() }
        return { ...updated, versions: [version, ...s.versions].slice(0, 10) }
      }),
    }))
  }, [])

  const deleteScript = useCallback((id: string) => {
    setData(d => ({ ...d, scripts: d.scripts.filter(s => s.id !== id) }))
  }, [])

  const getScript = useCallback((id: string) => data.scripts.find(s => s.id === id), [data])

  // --- Sponsors ---
  const addSponsor = useCallback((sponsor: Omit<Sponsor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString()
    setData(d => ({
      ...d,
      sponsors: [{ ...sponsor, id: uid(), createdAt: now, updatedAt: now }, ...d.sponsors],
    }))
  }, [])

  const updateSponsor = useCallback((id: string, updates: Partial<Sponsor>) => {
    setData(d => ({
      ...d,
      sponsors: d.sponsors.map(s => s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s),
    }))
  }, [])

  const deleteSponsor = useCallback((id: string) => {
    setData(d => ({ ...d, sponsors: d.sponsors.filter(s => s.id !== id) }))
  }, [])

  const getSponsor = useCallback((id: string) => data.sponsors.find(s => s.id === id), [data])

  // --- Calendar ---
  const addCalendarEvent = useCallback((event: Omit<CalendarEvent, 'id'>) => {
    setData(d => ({ ...d, calendar: [...d.calendar, { ...event, id: uid() }] }))
  }, [])

  const updateCalendarEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    setData(d => ({
      ...d,
      calendar: d.calendar.map(e => e.id === id ? { ...e, ...updates } : e),
    }))
  }, [])

  const deleteCalendarEvent = useCallback((id: string) => {
    setData(d => ({ ...d, calendar: d.calendar.filter(e => e.id !== id) }))
  }, [])

  // --- Library ---
  const addLibraryItem = useCallback((item: Omit<LibraryItem, 'id' | 'createdAt'>) => {
    setData(d => ({
      ...d,
      library: [...d.library, { ...item, id: uid(), createdAt: new Date().toISOString() }],
    }))
  }, [])

  const updateLibraryItem = useCallback((id: string, updates: Partial<LibraryItem>) => {
    setData(d => ({
      ...d,
      library: d.library.map(i => i.id === id ? { ...i, ...updates } : i),
    }))
  }, [])

  const deleteLibraryItem = useCallback((id: string) => {
    setData(d => ({ ...d, library: d.library.filter(i => i.id !== id) }))
  }, [])

  // --- Settings ---
  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setData(d => ({ ...d, settings: { ...d.settings, ...updates } }))
  }, [])

  const completeOnboarding = useCallback(() => {
    setData(d => ({ ...d, settings: { ...d.settings, onboardingComplete: true } }))
  }, [])

  // --- Data ---
  const clearData = useCallback(() => {
    setData(seedData)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const exportData = useCallback(() => {
    return JSON.stringify(data, null, 2)
  }, [data])

  return (
    <DataContext.Provider value={{
      data,
      getChannel,
      addContent, updateContent, deleteContent, getContent,
      addIdea, updateIdea, deleteIdea, getIdea,
      addScript, updateScript, deleteScript, getScript,
      addSponsor, updateSponsor, deleteSponsor, getSponsor,
      addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
      addLibraryItem, updateLibraryItem, deleteLibraryItem,
      updateSettings, completeOnboarding, clearData, exportData,
    }}>
      {children}
    </DataContext.Provider>
  )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
