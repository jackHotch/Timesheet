'use client'

import { useState, useMemo, useRef, useCallback, useEffect } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, Plus, X, Upload, FileText, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusDropdown } from '@/components/ui/status-dropdown'
import { cn } from '@/lib/utils'
import { useHourlyRate } from '@/hooks/use-hourly-rate'
import { SummaryCard } from '@/components/timesheet/summary-card'
import { useInvoicesForPeriod, useUpdateInvoiceStatus, useInvoiceById } from '@/hooks/use-invoice'
import {
  useProjects,
  useTimesheetEntries,
  useCreateProject,
  useDeleteProject,
  useUpsertEntry,
  type Entries,
} from '@/hooks/use-timesheet'
import { Half, InvoiceStatus, Period } from '@/lib/types'
import { MONTH_SHORT, PROJECT_COLORS, MONTH_NAMES, DAY_NAMES } from '@/lib/constants'

type FullPeriod = Required<Period>

function getWeekdays(year: number, month: number, half: FullPeriod['half']): Date[] {
  const start = half === Half.FIRST_HALF ? 1 : 15
  const end = half === Half.FIRST_HALF ? 14 : new Date(year, month, 0).getDate()
  const days: Date[] = []
  for (let d = start; d <= end; d++) {
    const date = new Date(year, month - 1, d)
    const dow = date.getDay()
    if (dow >= 1 && dow <= 5) days.push(date)
  }
  return days
}

function getPeriodLabel(year: number, month: number, half: FullPeriod['half']): string {
  const startDay = half === Half.FIRST_HALF ? 1 : 15
  const endDay = half === Half.FIRST_HALF ? 14 : new Date(year, month, 0).getDate()
  return `${MONTH_SHORT[month - 1]} ${startDay}–${endDay}, ${year}`
}

function navigatePeriod(p: FullPeriod, dir: 1 | -1): FullPeriod {
  let { year, month, half } = p
  if (dir === 1) {
    if (half === Half.FIRST_HALF) return { year, month, half: Half.SECOND_HALF }
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
    return { year, month, half: Half.FIRST_HALF }
  } else {
    if (half === Half.SECOND_HALF) return { year, month, half: Half.FIRST_HALF }
    month -= 1
    if (month < 1) {
      month = 12
      year -= 1
    }
    return { year, month, half: Half.SECOND_HALF }
  }
}

function getCurrentPeriod(): FullPeriod {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
    half: now.getDate() <= 14 ? Half.FIRST_HALF : Half.SECOND_HALF,
  }
}

function isCurrentPeriod(p: FullPeriod): boolean {
  const c = getCurrentPeriod()
  return p.year === c.year && p.month === c.month && p.half === c.half
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// ISO date string for API calls (YYYY-MM-DD)
function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TimesheetPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Capture the UUID present in the URL on initial mount
  const [initialUrlId] = useState(() => searchParams.get('id'))

  // Fetch that invoice to derive its period (year/month/half)
  const { data: invoiceByUrl, isLoading: loadingFromUrl } = useInvoiceById(initialUrlId)

  // Period is null while we wait to resolve it from the URL UUID
  const [period, setPeriod] = useState<FullPeriod | null>(() =>
    initialUrlId ? null : getCurrentPeriod()
  )

  // Once the URL invoice resolves, set the period (or fall back to today)
  useEffect(() => {
    if (period !== null || loadingFromUrl) return
    setPeriod(
      invoiceByUrl
        ? { year: invoiceByUrl.year, month: invoiceByUrl.month, half: invoiceByUrl.period }
        : getCurrentPeriod()
    )
  }, [invoiceByUrl, loadingFromUrl, period])

  const { data: rateData } = useHourlyRate()
  const HOURLY_RATE = rateData?.hourly_rate ?? 0

  const { data } = useInvoicesForPeriod(period)
  const invoice = data?.[0]
  const updateStatus = useUpdateInvoiceStatus(period ?? getCurrentPeriod())
  const [newProject, setNewProject] = useState('')
  const [activatedProjectIds, setActivatedProjectIds] = useState<Set<string>>(new Set())

  // Local overrides give instant UI feedback; server state is the source of truth on load
  const [entryOverrides, setEntryOverrides] = useState<Entries>({})

  const { data: projects = [] } = useProjects()
  const { data: serverEntries = {} } = useTimesheetEntries(period)

  // Merge server entries with local overrides (overrides win)
  const entries = useMemo<Entries>(() => {
    const merged: Entries = {}
    for (const key of new Set([...Object.keys(serverEntries), ...Object.keys(entryOverrides)])) {
      merged[key] = {
        ...(serverEntries[key] ?? {}),
        ...(entryOverrides[key] ?? {}),
      }
    }
    return merged
  }, [serverEntries, entryOverrides])

  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const upsertEntry = useUpsertEntry(period ?? getCurrentPeriod())

  const saving = upsertEntry.isPending || createProject.isPending

  // Debounce timer refs keyed by "date|projectId"
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function changePeriod(dir: 1 | -1) {
    setPeriod((p) => navigatePeriod(p!, dir))
    setEntryOverrides({})
    setActivatedProjectIds(new Set())
  }

  // Keep the URL in sync with the active period's invoice UUID
  useEffect(() => {
    if (!period) return
    if (invoice?.invoice_id) {
      router.replace(`${pathname}?id=${invoice.invoice_id}`, { scroll: false })
    } else {
      router.replace(pathname, { scroll: false })
    }
  }, [invoice?.invoice_id, period, pathname, router])

  const days = useMemo(() => period ? getWeekdays(period.year, period.month, period.half) : [], [period])
  const periodLabel = useMemo(() => period ? getPeriodLabel(period.year, period.month, period.half) : '', [period])

  // Only show projects that are relevant to this period: Administration always, plus any
  // with logged entries or explicitly added by the user this session.
  const periodProjects = useMemo(() => {
    const withEntries = new Set<string>()
    for (const dayEntries of Object.values(entries)) {
      for (const [projectId, hours] of Object.entries(dayEntries)) {
        if ((hours as number) > 0) withEntries.add(projectId)
      }
    }
    return projects.filter((p) => p.name === 'Administration' || withEntries.has(p.id) || activatedProjectIds.has(p.id))
  }, [projects, entries, activatedProjectIds])

  const dayTotals = useMemo(
    () =>
      days.map((day) => {
        const key = dateKey(day)
        return periodProjects.reduce((sum, p) => sum + ((entries[key] || {})[p.id] || 0), 0)
      }),
    [days, entries, periodProjects]
  )

  const projectTotals = useMemo(
    () =>
      periodProjects.map((project) =>
        days.reduce((sum, day) => sum + ((entries[dateKey(day)] || {})[project.id] || 0), 0)
      ),
    [days, entries, periodProjects]
  )

  const grandTotal = useMemo(() => dayTotals.reduce((s, t) => s + t, 0), [dayTotals])
  const estimatedEarnings = grandTotal * HOURLY_RATE
  const daysLogged = dayTotals.filter((t) => t > 0).length

  const setEntry = useCallback(
    (day: Date, projectId: string, value: number) => {
      const key = dateKey(day)
      const hours = Math.max(0, value)

      // Update local override immediately for instant UI feedback
      setEntryOverrides((prev) => ({
        ...prev,
        [key]: { ...(prev[key] ?? {}), [projectId]: hours },
      }))

      // Debounce the network call
      const timerKey = `${isoDate(day)}|${projectId}`
      clearTimeout(debounceTimers.current[timerKey])
      debounceTimers.current[timerKey] = setTimeout(() => {
        upsertEntry.mutate({ projectId, date: isoDate(day), hours })
      }, 500)
    },
    [upsertEntry]
  )

  function addProject() {
    const name = newProject.trim()
    if (!name) return
    const existing = projects.find((p) => p.name.toLowerCase() === name.toLowerCase())
    if (existing) {
      setActivatedProjectIds((prev) => new Set([...prev, existing.id]))
    } else {
      const colorIndex = projects.length % PROJECT_COLORS.length
      createProject.mutate(
        { name, colorIndex },
        {
          onSuccess: (data) => setActivatedProjectIds((prev) => new Set([...prev, data.id])),
        }
      )
    }
    setNewProject('')
  }

  function removeProject(id: string) {
    deleteProject.mutate(id)
  }

  if (!period) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">Timesheet</h1>
              {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {MONTH_NAMES[period.month - 1]} {period.year} · {period.half === Half.FIRST_HALF ? 'First half' : 'Second half'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {invoice && (
              <StatusDropdown
                value={invoice.status}
                onChange={(status) => updateStatus.mutate({ id: invoice.invoice_id, status: status as InvoiceStatus })}
                disabled={updateStatus.isPending}
              />
            )}

            <div className="flex items-center gap-3 rounded-full border bg-background p-2 text-sm">
              <button
                onClick={() => changePeriod(-1)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="min-w-45 text-center">
                <p className="font-semibold text-foreground">{periodLabel}</p>
                {isCurrentPeriod(period) && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Current period
                  </span>
                )}
              </div>
              <button
                onClick={() => changePeriod(1)}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-accent"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="Total Hours"
            value={grandTotal.toFixed(1)}
            sub={`this period · ${periodProjects.length} projects`}
          />
          <SummaryCard
            label="Estimated Earnings"
            value={`$${estimatedEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub={`at $${HOURLY_RATE}/hr`}
          />
          <SummaryCard label="Days Logged" value={String(daysLogged)} sub={`of ${days.length} workdays`} />
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <span className="text-xs text-muted-foreground">{periodProjects.length} active</span>
          </div>
          <div className="mb-4 flex min-h-7 flex-wrap gap-2">
            {periodProjects.map((project) => {
              const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
              return (
                <span
                  key={project.id}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                    color.badge
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: color.dot }} />
                  {project.name}
                  <button
                    onClick={() => removeProject(project.id)}
                    className="ml-0.5 opacity-50 transition-opacity hover:opacity-100"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a new project..."
              value={newProject}
              onChange={(e) => setNewProject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addProject()}
              className="h-9 text-sm"
            />
            <Button onClick={addProject} disabled={!newProject.trim()} className="h-9 whitespace-nowrap">
              <Plus />
              Add
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-muted/30">
                  <th className="w-56 border border-border px-5 py-3.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                    Day
                  </th>
                  {periodProjects.map((project) => {
                    const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                    return (
                      <th
                        key={project.id}
                        className={cn(
                          'min-w-30 border border-border px-3 py-3.5 text-center text-xs font-semibold tracking-wider whitespace-nowrap uppercase',
                          color.header
                        )}
                      >
                        {project.name}
                      </th>
                    )
                  })}
                  <th className="w-20 border border-border px-3 py-3.5 text-right text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIdx) => {
                  const key = dateKey(day)
                  const dayTotal = dayTotals[dayIdx]
                  return (
                    <tr key={key} className="transition-colors hover:bg-muted/20">
                      <td className="border border-border px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-foreground">{DAY_NAMES[day.getDay() - 1]}</p>
                        <p className="text-xs text-muted-foreground">
                          {MONTH_SHORT[day.getMonth()]} {day.getDate()}
                        </p>
                      </td>
                      {periodProjects.map((project) => {
                        const val = (entries[key] || {})[project.id] || 0
                        return (
                          <td key={project.id} className="border border-border px-3 py-3">
                            <HoursInput value={val} onChange={(v) => setEntry(day, project.id, v)} />
                          </td>
                        )
                      })}
                      <td className="border border-border px-5 py-3.5 text-right whitespace-nowrap">
                        <span
                          className={cn('font-semibold', dayTotal > 0 ? 'text-foreground' : 'text-muted-foreground')}
                        >
                          {dayTotal > 0 ? dayTotal.toFixed(2) : '—'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40">
                  <td className="border border-t-2 border-border px-5 py-3.5 whitespace-nowrap">
                    <p className="font-semibold text-foreground">Period Total</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{periodLabel}</p>
                  </td>
                  {projectTotals.map((total, i) => (
                    <td
                      key={periodProjects[i].id}
                      className="border border-t-2 border-border px-3 py-3.5 text-center whitespace-nowrap"
                    >
                      <span className="text-sm font-bold text-foreground">{total > 0 ? total.toFixed(2) : '—'}</span>
                    </td>
                  ))}
                  <td className="border border-t-2 border-border px-5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-primary">
                      {grandTotal > 0 ? grandTotal.toFixed(2) : '—'}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_300px] items-stretch gap-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-4 text-sm font-semibold text-foreground">Invoice Preview</h2>
            <div className="space-y-4">
              {periodProjects.map((project, i) => {
                const total = projectTotals[i]
                const amount = total * HOURLY_RATE
                const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                return (
                  <div key={project.id} className="mb-1.5 flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color.dot }} />
                      <span className="truncate text-sm text-foreground">{project.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="ml-2 min-w-8 shrink-0 text-sm font-semibold text-muted-foreground">
                        {total.toFixed(1)} hrs
                      </span>
                      <span className="mt-0.5 min-w-24 text-right text-sm text-foreground">
                        $
                        {amount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 border-t border-border pt-4">
              <div className="flex items-end justify-between">
                <span className="text-sm font-semibold text-foreground">Total Due</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    $
                    {estimatedEarnings.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 text-sm font-semibold text-foreground">Documents</h2>
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex min-h-20 flex-1 cursor-pointer items-center gap-4 rounded-lg border-2 border-dashed border-border bg-muted/30 px-4 transition-colors hover:bg-muted/50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Upload invoice PDF</p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Drop your generated invoice here, or click to browse.
                  </p>
                </div>
              </div>
              <div className="flex min-h-20 flex-1 cursor-pointer items-center gap-4 rounded-lg border border-border bg-muted/30 px-4 transition-colors hover:bg-muted/50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background shadow-sm">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Generate PDF Summary</p>
                  <p className="text-xs leading-snug text-muted-foreground">
                    Export a full summary of this period as a PDF.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HoursInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false)

  function step(delta: number) {
    const next = Math.round(((value || 0) + delta) * 4) / 4
    onChange(Math.max(0, next))
  }

  return (
    <div
      className={cn(
        'flex h-11 items-center overflow-hidden rounded-lg border transition-colors',
        focused ? 'border-primary ring-1 ring-primary/20' : 'border-border bg-muted/40'
      )}
    >
      <input
        type="number"
        min={0}
        max={16}
        step={0.25}
        value={value || ''}
        placeholder="—"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="min-w-0 flex-1 [appearance:textfield] bg-transparent py-1.5 text-center text-sm outline-none placeholder:text-muted-foreground [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="flex h-full shrink-0 flex-col border-l border-border">
        <button
          onClick={() => step(0.25)}
          className="flex flex-1 items-center justify-center px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="text-[9px] leading-none">▲</span>
        </button>
        <button
          onClick={() => step(-0.25)}
          className="flex flex-1 items-center justify-center border-t border-border px-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="text-[9px] leading-none">▼</span>
        </button>
      </div>
    </div>
  )
}
