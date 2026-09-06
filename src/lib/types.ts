// Core types for ClipFlow

export type Platform = 'youtube' | 'tiktok' | 'instagram' | 'x' | 'linkedin'

export type ContentStatus =
  | 'idea'
  | 'developing'
  | 'ready_to_script'
  | 'recording'
  | 'editing'
  | 'scheduled'
  | 'published'

export type IdeaStatus =
  | 'idea'
  | 'developing'
  | 'ready_to_script'
  | 'recording'
  | 'editing'
  | 'scheduled'
  | 'published'

export type Priority = 'low' | 'medium' | 'high'

export type SponsorStatus =
  | 'contacted'
  | 'negotiating'
  | 'approved'
  | 'in_progress'
  | 'completed'
  | 'paid'

export type PaymentStatus = 'pending' | 'partial' | 'paid'

export interface Channel {
  id: string
  name: string
  platform: Platform
  username: string
  followers: number
  avatar?: string
}

export interface Content {
  id: string
  title: string
  description: string
  platform: Platform
  status: ContentStatus
  thumbnail?: string
  scriptId?: string
  scheduledAt?: string
  publishedAt?: string
  views: number
  likes: number
  comments: number
  shares: number
  engagementRate: number
  revenue: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Idea {
  id: string
  title: string
  hook: string
  description: string
  platform: Platform
  category: string
  tags: string[]
  viralScore: number
  status: IdeaStatus
  priority: Priority
  notes: string
  trending?: boolean        // auto-refreshed daily from trend sources
  lastRefreshed?: string    // ISO date of last trend refresh
  createdAt: string
  updatedAt: string
}

export interface Script {
  id: string
  title: string
  contentId?: string
  hook: string
  introduction: string
  body: string
  examples: string
  cta: string
  notes: string
  wordCount: number
  charCount: number
  createdAt: string
  updatedAt: string
  versions: ScriptVersion[]
}

export interface ScriptVersion {
  id: string
  content: Omit<Script, 'versions'>
  savedAt: string
}

export interface Sponsor {
  id: string
  company: string
  contact: string
  email: string
  campaign: string
  dealValue: number
  status: SponsorStatus
  paymentStatus: PaymentStatus
  deadline: string
  notes: string
  createdAt: string
  updatedAt: string
}

export interface CalendarEvent {
  id: string
  contentId: string
  title: string
  platform: Platform
  date: string
  time?: string
  status: ContentStatus
}

export interface LibraryItem {
  id: string
  name: string
  type: 'video' | 'image' | 'thumbnail' | 'script' | 'document' | 'other'
  size: number
  url: string
  category: string
  createdAt: string
}

export interface UserProfile {
  name: string
  handle: string
  avatar?: string
  bio: string
}

export interface CreatorPreferences {
  platforms: Platform[]
  categories: string[]
  weeklyGoal: number
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  inApp: boolean
  weeklyDigest: boolean
}

export interface AppSettings {
  profile: UserProfile
  preferences: CreatorPreferences
  notifications: NotificationSettings
  onboardingComplete: boolean
  theme: 'dark' | 'light'
}

export interface AppData {
  channels: Channel[]
  content: Content[]
  ideas: Idea[]
  scripts: Script[]
  sponsors: Sponsor[]
  calendar: CalendarEvent[]
  library: LibraryItem[]
  settings: AppSettings
}

export interface AnalyticsData {
  views: number[]
  engagement: number[]
  followers: number[]
  dates: string[]
}
