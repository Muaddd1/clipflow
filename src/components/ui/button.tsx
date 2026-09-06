import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg' | 'icon'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg cursor-pointer disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.97]'

    const variants = {
      primary: 'bg-violet text-white hover:bg-violet-light shadow-sm shadow-violet/20',
      secondary: 'bg-white/5 text-white/80 hover:bg-white/10 border border-white/10',
      ghost: 'text-white/60 hover:text-white hover:bg-white/5',
      destructive: 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
      outline: 'border border-white/10 bg-transparent hover:bg-white/5 text-white/80',
    }

    const sizes = {
      sm: 'text-xs px-3 py-1.5 h-8',
      md: 'text-sm px-4 py-2 h-9',
      lg: 'text-sm px-5 py-2.5 h-10',
      icon: 'h-9 w-9',
    }

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
