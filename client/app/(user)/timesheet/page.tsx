"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Plus, X, Upload, FileText, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { useHourlyRate } from "@/hooks/use-hourly-rate"
import { SummaryCard } from "@/components/timesheet/summary-card"
import {
  useProjects,
  useTimesheetEntries,
  useCreateProject,
  useDeleteProject,
  useUpsertEntry,
  type Entries,
} from "@/hooks/use-timesheet"

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = {
  year: number
  month: number
  half: "first" | "second"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PROJECT_COLORS = [
  { dot: "#6366f1", header: "text-indigo-600",  badge: "bg-indigo-50 text-indigo-700 border-indigo-200"  },
  { dot: "#22c55e", header: "text-green-600",   badge: "bg-green-50 text-green-700 border-green-200"     },
  { dot: "#f97316", header: "text-orange-600",  badge: "bg-orange-50 text-orange-700 border-orange-200"  },
  { dot: "#0ea5e9", header: "text-sky-600",     badge: "bg-sky-50 text-sky-700 border-sky-200"           },
  { dot: "#ec4899", header: "text-pink-600",    badge: "bg-pink-50 text-pink-700 border-pink-200"        },
  { dot: "#8b5cf6", header: "text-violet-600",  badge: "bg-violet-50 text-violet-700 border-violet-200"  },
  { dot: "#14b8a6", header: "text-teal-600",    badge: "bg-teal-50 text-teal-700 border-teal-200"        },
  { dot: "#f43f5e", header: "text-rose-600",    badge: "bg-rose-50 text-rose-700 border-rose-200"        },
]

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const DAY_NAMES   = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekdays(year: number, month: number, half: "first" | "second"): Date[] {
  const start = half === "first" ? 1 : 15
  const end   = half === "first" ? 14 : new Date(year, month + 1, 0).getDate()
  const days: Date[] = []
  for (let d = start; d <= end; d++) {
    const date = new Date(year, month, d)
    const dow  = date.getDay()
    if (dow >= 1 && dow <= 5) days.push(date)
  }
  return days
}

function getPeriodLabel(year: number, month: number, half: "first" | "second"): string {
  const startDay = half === "first" ? 1 : 15
  const endDay   = half === "first" ? 14 : new Date(year, month + 1, 0).getDate()
  return `${MONTH_SHORT[month]} ${startDay}–${endDay}, ${year}`
}

function navigatePeriod(p: Period, dir: 1 | -1): Period {
  let { year, month, half } = p
  if (dir === 1) {
    if (half === "first") return { year, month, half: "second" }
    month += 1
    if (month > 11) { month = 0; year += 1 }
    return { year, month, half: "first" }
  } else {
    if (half === "second") return { year, month, half: "first" }
    month -= 1
    if (month < 0) { month = 11; year -= 1 }
    return { year, month, half: "second" }
  }
}

function getCurrentPeriod(): Period {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth(), half: now.getDate() <= 14 ? "first" : "second" }
}

function isCurrentPeriod(p: Period): boolean {
  const c = getCurrentPeriod()
  return p.year === c.year && p.month === c.month && p.half === c.half
}

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

// ISO date string for API calls (YYYY-MM-DD)
function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function TimesheetPage() {
  const { data: rateData } = useHourlyRate()
  const HOURLY_RATE = rateData?.hourly_rate ?? 0

  const [period, setPeriod] = useState<Period>(getCurrentPeriod)
  const [newProject, setNewProject] = useState("")

  // Local overrides give instant UI feedback; server state is the source of truth on load
  const [entryOverrides, setEntryOverrides] = useState<Entries>({})

  const { data: projects = [] } = useProjects()
  const { data: serverEntries = {} } = useTimesheetEntries(period)

  // Merge server entries with local overrides (overrides win)
  const entries = useMemo<Entries>(() => {
    const merged: Entries = {}
    for (const key of new Set([...Object.keys(serverEntries), ...Object.keys(entryOverrides)])) {
      merged[key] = { ...(serverEntries[key] ?? {}), ...(entryOverrides[key] ?? {}) }
    }
    return merged
  }, [serverEntries, entryOverrides])

  const createProject = useCreateProject()
  const deleteProject = useDeleteProject()
  const upsertEntry   = useUpsertEntry(period)

  const saving = upsertEntry.isPending || createProject.isPending

  // Debounce timer refs keyed by "date|projectId"
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  function changePeriod(dir: 1 | -1) {
    setPeriod(p => navigatePeriod(p, dir))
    setEntryOverrides({})
  }

  const days = useMemo(() => getWeekdays(period.year, period.month, period.half), [period])
  const periodLabel = useMemo(() => getPeriodLabel(period.year, period.month, period.half), [period])

  const dayTotals = useMemo(() =>
    days.map(day => {
      const key = dateKey(day)
      return projects.reduce((sum, p) => sum + ((entries[key] || {})[p.id] || 0), 0)
    }),
    [days, entries, projects]
  )

  const projectTotals = useMemo(() =>
    projects.map(project =>
      days.reduce((sum, day) => sum + ((entries[dateKey(day)] || {})[project.id] || 0), 0)
    ),
    [days, entries, projects]
  )

  const grandTotal        = useMemo(() => dayTotals.reduce((s, t) => s + t, 0), [dayTotals])
  const estimatedEarnings = grandTotal * HOURLY_RATE
  const daysLogged        = dayTotals.filter(t => t > 0).length

  const setEntry = useCallback((day: Date, projectId: string, value: number) => {
    const key = dateKey(day)
    const hours = Math.max(0, value)

    // Update local override immediately for instant UI feedback
    setEntryOverrides(prev => ({
      ...prev,
      [key]: { ...(prev[key] ?? {}), [projectId]: hours },
    }))

    // Debounce the network call
    const timerKey = `${isoDate(day)}|${projectId}`
    clearTimeout(debounceTimers.current[timerKey])
    debounceTimers.current[timerKey] = setTimeout(() => {
      upsertEntry.mutate({ projectId, date: isoDate(day), hours })
    }, 500)
  }, [upsertEntry])

  function addProject() {
    const name = newProject.trim()
    if (!name) return
    const colorIndex = projects.length % PROJECT_COLORS.length
    createProject.mutate({ name, colorIndex })
    setNewProject("")
  }

  function removeProject(id: string) {
    deleteProject.mutate(id)
  }

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-heading font-bold text-foreground">Timesheet</h1>
              {saving && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {MONTH_NAMES[period.month]} {period.year} · {period.half === "first" ? "First half" : "Second half"}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-background border rounded-full text-sm p-2">
            <button
              onClick={() => changePeriod(-1)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-45">
              <p className="font-semibold text-foreground">{periodLabel}</p>
              {isCurrentPeriod(period) && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Current period
                </span>
              )}
            </div>
            <button
              onClick={() => changePeriod(1)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className=" space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="Total Hours"
            value={grandTotal.toFixed(1)}
            sub={`this period · ${projects.length} projects`}
          />
          <SummaryCard
            label="Estimated Earnings"
            value={`$${estimatedEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            sub={`at $${HOURLY_RATE}/hr`}
          />
          <SummaryCard
            label="Days Logged"
            value={String(daysLogged)}
            sub={`of ${days.length} workdays`}
          />

        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Projects</h2>
            <span className="text-xs text-muted-foreground">{projects.length} active</span>
          </div>
          <div className="flex flex-wrap gap-2 mb-4 min-h-7">
            {projects.map(project => {
              const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
              return (
                <span
                  key={project.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border",
                    color.badge
                  )}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: color.dot }} />
                  {project.name}
                  <button
                    onClick={() => removeProject(project.id)}
                    className="ml-0.5 opacity-50 hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )
            })}
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a new project..."
              value={newProject}
              onChange={e => setNewProject(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addProject()}
              className="h-9 text-sm"
            />
            <Button onClick={addProject} disabled={!newProject.trim()} className="h-9 whitespace-nowrap">
              <Plus />
              Add
            </Button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/30">
                  <th className="border border-border text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-56 whitespace-nowrap">
                    Day
                  </th>
                  {projects.map(project => {
                    const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                    return (
                      <th
                        key={project.id}
                        className={cn(
                          "border border-border px-3 py-3.5 text-xs font-semibold uppercase tracking-wider text-center min-w-30 whitespace-nowrap",
                          color.header
                        )}
                      >
                        {project.name}
                      </th>
                    )
                  })}
                  <th className="border border-border px-3 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right whitespace-nowrap w-20">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {days.map((day, dayIdx) => {
                  const key      = dateKey(day)
                  const dayTotal = dayTotals[dayIdx]
                  return (
                    <tr
                      key={key}
                      className="hover:bg-muted/20 transition-colors"
                    >
                      <td className="border border-border px-5 py-3.5 whitespace-nowrap">
                        <p className="font-semibold text-foreground">{DAY_NAMES[day.getDay() - 1]}</p>
                        <p className="text-xs text-muted-foreground">
                          {MONTH_SHORT[day.getMonth()]} {day.getDate()}
                        </p>
                      </td>
                      {projects.map(project => {
                        const val = (entries[key] || {})[project.id] || 0
                        return (
                          <td key={project.id} className="border border-border px-3 py-3">
                            <HoursInput value={val} onChange={v => setEntry(day, project.id, v)} />
                          </td>
                        )
                      })}
                      <td className="border border-border px-5 py-3.5 text-right whitespace-nowrap">
                        <span className={cn("font-semibold", dayTotal > 0 ? "text-foreground" : "text-muted-foreground")}>
                          {dayTotal > 0 ? dayTotal.toFixed(2) : "—"}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40">
                  <td className="border border-border border-t-2 px-5 py-3.5 whitespace-nowrap">
                    <p className="font-semibold text-foreground">Period Total</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{periodLabel}</p>
                  </td>
                  {projectTotals.map((total, i) => (
                    <td key={projects[i].id} className="border border-border border-t-2 px-3 py-3.5 text-center whitespace-nowrap">
                      <span className="text-sm font-bold text-foreground">
                        {total > 0 ? total.toFixed(2) : "—"}
                      </span>
                    </td>
                  ))}
                  <td className="border border-border border-t-2 px-5 py-3.5 text-right whitespace-nowrap">
                    <span className="text-sm font-bold text-primary">
                      {grandTotal > 0 ? grandTotal.toFixed(2) : "—"}
                    </span>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_300px] gap-6 items-stretch">
          <div className="bg-card border border-border rounded-xl p-5">
            <h2 className="text-sm font-semibold text-foreground mb-4">Invoice Preview</h2>
            <div className="space-y-4">
              {projects.map((project, i) => {
                const total  = projectTotals[i]
                const amount = total * HOURLY_RATE
                const color  = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                return (
                  <div key={project.id} className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-3 min-w-0 ">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color.dot }} />
                      <span className="text-sm text-foreground truncate">{project.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-sm font-semibold text-muted-foreground ml-2 shrink-0 min-w-8">
                        {total.toFixed(1)} hrs
                      </span>
                      <span className="text-sm text-foreground mt-0.5 text-right min-w-24">${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-5 pt-4 border-t border-border">
              <div className="flex items-end justify-between">
                <span className="text-sm font-semibold text-foreground">Total Due</span>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">
                    ${estimatedEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5 flex flex-col">
            <h2 className="text-sm font-semibold text-foreground mb-3">Documents</h2>
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex-1 min-h-20 border-2 border-dashed border-border rounded-lg bg-muted/30 flex items-center gap-4 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-11 h-11 bg-background border border-border rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <Upload className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Upload invoice PDF</p>
                  <p className="text-xs text-muted-foreground leading-snug">Drop your generated invoice here, or click to browse.</p>
                </div>
              </div>
              <div className="flex-1 min-h-20 border border-border rounded-lg bg-muted/30 flex items-center gap-4 px-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="w-11 h-11 bg-background border border-border rounded-lg flex items-center justify-center shrink-0 shadow-sm">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Generate PDF Summary</p>
                  <p className="text-xs text-muted-foreground leading-snug">Export a full summary of this period as a PDF.</p>
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
        "flex items-center border rounded-lg overflow-hidden h-11 transition-colors",
        focused ? "border-primary ring-1 ring-primary/20" : "border-border bg-muted/40"
      )}
    >
      <input
        type="number"
        min={0}
        max={16}
        step={0.25}
        value={value || ""}
        placeholder="—"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="flex-1 min-w-0 text-center text-sm bg-transparent outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground"
      />
      <div className="flex flex-col border-l border-border h-full shrink-0">
        <button
          onClick={() => step(0.25)}
          className="flex-1 px-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
        >
          <span className="text-[9px] leading-none">▲</span>
        </button>
        <button
          onClick={() => step(-0.25)}
          className="flex-1 px-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-t border-border flex items-center justify-center"
        >
          <span className="text-[9px] leading-none">▼</span>
        </button>
      </div>
    </div>
  )
}
