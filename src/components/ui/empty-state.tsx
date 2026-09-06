interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/20 mb-4">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-white/70 mb-1">{title}</h3>
      <p className="text-sm text-white/30 max-w-sm mb-6">{description}</p>
      {action}
    </div>
  )
}
