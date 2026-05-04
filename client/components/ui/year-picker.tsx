'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface YearPickerProps {
  value: string
  onChange: (year: string) => void
}

function YearPicker({ value, onChange }: YearPickerProps) {
  const year = parseInt(value, 10)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(String(year - 1))}
        aria-label="Previous year"
      >
        <ChevronLeft />
      </Button>

      <span className="min-w-10 text-center text-xs font-medium tabular-nums">{year}</span>

      <Button
        variant="outline"
        size="icon-sm"
        onClick={() => onChange(String(year + 1))}
        aria-label="Next year"
      >
        <ChevronRight />
      </Button>
    </div>
  )
}

export { YearPicker }
