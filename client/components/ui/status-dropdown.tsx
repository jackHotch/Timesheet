'use client'

import { useState, useRef, useEffect } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { INVOICE_STATUS_OPTIONS as options } from '@/lib/constants'

export type StatusOption = {
  value: string
  label: string
  dotColor: string
  bgColor?: string
  textColor?: string
  darkDotColor?: string
  darkBgColor?: string
  darkTextColor?: string
}

interface StatusDropdownProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
}

function useDarkMode(): boolean {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    setDark(el.classList.contains('dark'))
    const observer = new MutationObserver(() => setDark(el.classList.contains('dark')))
    observer.observe(el, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return dark
}

function StatusDropdown({ value, onChange, disabled, className }: StatusDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dark = useDarkMode()
  const selected = options.find((o) => o.value === value) ?? options[0]

  const triggerBg = dark ? (selected?.darkBgColor ?? selected?.bgColor ?? '#2a2a2a') : (selected?.bgColor ?? '#f3f4f6')
  const triggerText = dark ? (selected?.darkTextColor ?? selected?.textColor ?? '#a0a0a0') : (selected?.textColor ?? '#374151')

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: PointerEvent) {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div ref={ref} className={cn('relative inline-block', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: triggerBg, color: triggerText }}
      >
        <span
          className="size-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: dark ? (selected?.darkDotColor ?? selected?.dotColor) : selected?.dotColor }}
        />
        {selected?.label}
        <ChevronDown className="size-3 opacity-60" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 min-w-[9.5rem] rounded-xl border border-border bg-popover p-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-sm transition-colors hover:bg-muted"
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: dark ? (option.darkDotColor ?? option.dotColor) : option.dotColor }}
              />
              <span className="flex-1 text-left">{option.label}</span>
              {option.value === value && <Check className="size-3.5 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export { StatusDropdown }
