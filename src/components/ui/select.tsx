import * as RadixSelect from '@radix-ui/react-select'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

interface SelectProps {
  label?: string
  error?: string
  value?: string
  onValueChange?: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
  className?: string
  id?: string
}

export const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ label, error, value, onValueChange, options, placeholder = 'Select...', className, id }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-mono text-white/40 uppercase tracking-wider">
            {label}
          </label>
        )}
        <RadixSelect.Root value={value} onValueChange={onValueChange}>
          <RadixSelect.Trigger
            ref={ref}
            id={id}
            className={cn(
              'w-full flex items-center justify-between gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5 text-sm text-white/80',
              'focus:outline-none focus:border-violet/50 focus:bg-violet/5 transition-all duration-200',
              'data-[placeholder]:text-white/30',
              error && 'border-red-500/50',
              className
            )}
          >
            <RadixSelect.Value placeholder={placeholder} />
            <RadixSelect.Icon>
              <ChevronDown size={14} className="text-white/30" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              className="bg-surface-raised border border-white/10 rounded-lg shadow-xl shadow-black/50 overflow-hidden z-50"
              position="popper"
              sideOffset={4}
            >
              <RadixSelect.Viewport className="p-1">
                {options.map(opt => (
                  <RadixSelect.Item
                    key={opt.value}
                    value={opt.value}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 rounded-md cursor-pointer outline-none hover:bg-white/5 hover:text-white data-[state=checked]:text-violet focus:bg-white/5"
                  >
                    <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="ml-auto">
                      <Check size={12} />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
