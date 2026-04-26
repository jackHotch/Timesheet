"use client"

import { useState, useMemo } from "react"
import { ChevronLeft, ChevronRight, Plus, X, Upload, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Project = {
  id: string
  name: string
  colorIndex: number
}

type Entries = Record<string, Record<string, number>>

type Period = {
  year: number
  month: number
  half: "first" | "second"
}

// ─── Constants ────────────────────────────────────────────────────────────────

const HOURLY_RATE = 50

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
const DAY_NAMES   = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const INITIAL_PROJECTS: Project[] = [
  { id: "1", name: "Administration", colorIndex: 0 },
  { id: "2", name: "Gazyva",         colorIndex: 1 },
  { id: "3", name: "Orsini",         colorIndex: 2 },
  { id: "4", name: "Thera",          colorIndex: 3 },
  { id: "5", name: "Veryfi",         colorIndex: 4 },
]

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
  return `${MONTH_SHORT[month]} ${startDay} – ${endDay}, ${year}`
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function TimesheetPage() {
  const [period, setPeriod]     = useState<Period>(getCurrentPeriod)
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS)
  const [entries, setEntries]   = useState<Entries>({})
  const [newProject, setNewProject] = useState("")

  const days        = useMemo(() => getWeekdays(period.year, period.month, period.half), [period])
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

  const grandTotal       = useMemo(() => dayTotals.reduce((s, t) => s + t, 0), [dayTotals])
  const estimatedEarnings = grandTotal * HOURLY_RATE
  const daysLogged       = dayTotals.filter(t => t > 0).length

  function setEntry(day: Date, projectId: string, value: number) {
    const key = dateKey(day)
    setEntries(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), [projectId]: Math.max(0, value) },
    }))
  }

  function addProject() {
    const name = newProject.trim()
    if (!name) return
    const colorIndex = projects.length % PROJECT_COLORS.length
    setProjects(prev => [...prev, { id: Date.now().toString(), name, colorIndex }])
    setNewProject("")
  }

  function removeProject(id: string) {
    setProjects(prev => prev.filter(p => p.id !== id))
    setEntries(prev => {
      const next = { ...prev }
      Object.keys(next).forEach(key => {
        if (next[key][id] !== undefined) {
          const { [id]: _, ...rest } = next[key]
          next[key] = rest
        }
      })
      return next
    })
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Page header */}
      <div className="border-b border-border bg-card px-8 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Timesheet</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {period.half === "first" ? "First half" : "Second half"} · {MONTH_NAMES[period.month]} {period.year}
            </p>
          </div>

          {/* Period navigator */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setPeriod(p => navigatePeriod(p, -1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-[180px]">
              <p className="font-semibold text-foreground">{periodLabel}</p>
              {isCurrentPeriod(period) && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  Current period
                </span>
              )}
            </div>
            <button
              onClick={() => setPeriod(p => navigatePeriod(p, 1))}
              className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <SummaryCard
            label="Total Hours"
            value={grandTotal.toFixed(1)}
            sub="this period"
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

        <div className="grid grid-cols-[1fr_300px] gap-6 items-start">
          {/* Left column */}
          <div className="space-y-4 min-w-0">
            {/* Project manager */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-foreground">Projects</h2>
                <span className="text-xs text-muted-foreground">{projects.length} active</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-4 min-h-[28px]">
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
                <Button onClick={addProject} disabled={!newProject.trim()} size="sm" className="whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-1" />
                  Add
                </Button>
              </div>
            </div>

            {/* Time grid */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36 whitespace-nowrap">
                        Day
                      </th>
                      {projects.map(project => {
                        const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                        return (
                          <th
                            key={project.id}
                            className={cn(
                              "px-3 py-3.5 text-xs font-semibold uppercase tracking-wider text-center min-w-[120px] whitespace-nowrap",
                              color.header
                            )}
                          >
                            {project.name}
                          </th>
                        )
                      })}
                      <th className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right whitespace-nowrap">
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
                          className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                        >
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <p className="font-semibold text-foreground">{DAY_NAMES[day.getDay()]}</p>
                            <p className="text-xs text-muted-foreground">
                              {MONTH_SHORT[day.getMonth()]} {day.getDate()}
                            </p>
                          </td>
                          {projects.map(project => {
                            const val = (entries[key] || {})[project.id] || 0
                            return (
                              <td key={project.id} className="px-3 py-3">
                                <HoursInput value={val} onChange={v => setEntry(day, project.id, v)} />
                              </td>
                            )
                          })}
                          <td className="px-5 py-3.5 text-right whitespace-nowrap">
                            <span className={cn("font-semibold", dayTotal > 0 ? "text-foreground" : "text-muted-foreground")}>
                              {dayTotal > 0 ? dayTotal.toFixed(1) : "—"}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/40 border-t-2 border-border">
                      <td className="px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        Total
                      </td>
                      {projectTotals.map((total, i) => (
                        <td key={projects[i].id} className="px-3 py-3.5 text-center whitespace-nowrap">
                          <span className="text-sm font-bold text-foreground">
                            {total > 0 ? total.toFixed(1) : "—"}
                          </span>
                        </td>
                      ))}
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-primary">
                          {grandTotal > 0 ? grandTotal.toFixed(1) : "—"}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Invoice overview */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-4">Invoice Overview</h2>
              <div className="space-y-4">
                {projects.map((project, i) => {
                  const total  = projectTotals[i]
                  const amount = total * HOURLY_RATE
                  const color  = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
                  const pct    = grandTotal > 0 ? (total / grandTotal) * 100 : 0
                  return (
                    <div key={project.id}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color.dot }} />
                          <span className="text-sm text-foreground truncate">{project.name}</span>
                        </div>
                        <span className="text-sm font-semibold text-foreground ml-2 shrink-0">
                          {total > 0 ? `${total.toFixed(1)}h` : "—"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, background: color.dot }}
                        />
                      </div>
                      {total > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5 text-right">
                          ${amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-border">
                <div className="flex items-end justify-between">
                  <span className="text-sm font-semibold text-foreground">Invoice Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      ${estimatedEarnings.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
                    <p className="text-xs text-muted-foreground">{grandTotal.toFixed(1)} hours</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Invoice actions */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">Invoice Actions</h2>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" disabled>
                  <Upload className="w-4 h-4" />
                  Upload Invoice
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm" disabled>
                  <FileText className="w-4 h-4" />
                  Generate PDF Summary
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-foreground mt-1.5">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function HoursInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [focused, setFocused] = useState(false)

  function step(delta: number) {
    const next = Math.round(((value || 0) + delta) * 2) / 2
    onChange(Math.max(0, next))
  }

  return (
    <div
      className={cn(
        "flex items-center border rounded-lg overflow-hidden h-9 transition-colors",
        focused ? "border-primary ring-1 ring-primary/20" : "border-border bg-muted/40"
      )}
    >
      <input
        type="number"
        min={0}
        max={24}
        step={0.5}
        value={value || ""}
        placeholder="—"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={e => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
        className="w-14 text-center text-sm bg-transparent outline-none py-1.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none placeholder:text-muted-foreground"
      />
      <div className="flex flex-col border-l border-border h-full">
        <button
          onClick={() => step(0.5)}
          className="flex-1 px-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
        >
          <span className="text-[9px] leading-none">▲</span>
        </button>
        <button
          onClick={() => step(-0.5)}
          className="flex-1 px-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors border-t border-border flex items-center justify-center"
        >
          <span className="text-[9px] leading-none">▼</span>
        </button>
      </div>
    </div>
  )
}
