'use client'

import { cn } from '@/lib/utils'

export interface FilterOption<T extends string = string> {
  label: string
  value: T
  count?: number
}

interface FilterTabsProps<T extends string = string> {
  options: FilterOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

function FilterTabs<T extends string = string>({
  options,
  value,
  onChange,
  className,
}: FilterTabsProps<T>) {
  return (
    <div className={cn('flex items-center gap-0.5 bg-muted rounded-md px-1 py-1.5', className)}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'flex items-center gap-1.5 rounded-sm px-3 py-1 text-xs font-medium transition-all',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn(
              'tabular-nums',
              value === option.value ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {option.count}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

export { FilterTabs }
