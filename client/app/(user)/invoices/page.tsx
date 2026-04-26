"use client"

import { Upload, FileText, Clock, DollarSign, TrendingUp, BarChart3, CheckCircle2, Circle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type InvoiceStatus = "draft" | "submitted" | "paid"

type Invoice = {
  id: string
  year: number
  month: number
  half: "first" | "second"
  totalHours: number
  totalAmount: number
  status: InvoiceStatus
  hasFile: boolean
  projects: { name: string; hours: number }[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const INVOICES: Invoice[] = [
  {
    id: "inv-12",
    year: 2026, month: 3, half: "first",
    totalHours: 0, totalAmount: 0, status: "draft", hasFile: false,
    projects: [],
  },
  {
    id: "inv-11",
    year: 2026, month: 2, half: "second",
    totalHours: 68.5, totalAmount: 3425, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 28 }, { name: "Orsini", hours: 20 }, { name: "Veryfi", hours: 12 }, { name: "Administration", hours: 8.5 }],
  },
  {
    id: "inv-10",
    year: 2026, month: 2, half: "first",
    totalHours: 62.0, totalAmount: 3100, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 24 }, { name: "Thera", hours: 18 }, { name: "Orsini", hours: 12 }, { name: "Administration", hours: 8 }],
  },
  {
    id: "inv-9",
    year: 2026, month: 1, half: "second",
    totalHours: 71.5, totalAmount: 3575, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 32 }, { name: "Veryfi", hours: 18 }, { name: "Orsini", hours: 14 }, { name: "Administration", hours: 7.5 }],
  },
  {
    id: "inv-8",
    year: 2026, month: 1, half: "first",
    totalHours: 58.0, totalAmount: 2900, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 22 }, { name: "Orsini", hours: 18 }, { name: "Thera", hours: 12 }, { name: "Administration", hours: 6 }],
  },
  {
    id: "inv-7",
    year: 2026, month: 0, half: "second",
    totalHours: 65.0, totalAmount: 3250, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 26 }, { name: "Veryfi", hours: 20 }, { name: "Orsini", hours: 12 }, { name: "Administration", hours: 7 }],
  },
  {
    id: "inv-6",
    year: 2026, month: 0, half: "first",
    totalHours: 48.5, totalAmount: 2425, status: "paid", hasFile: false,
    projects: [{ name: "Gazyva", hours: 20 }, { name: "Orsini", hours: 16 }, { name: "Administration", hours: 12.5 }],
  },
  {
    id: "inv-5",
    year: 2025, month: 11, half: "second",
    totalHours: 55.0, totalAmount: 2750, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 22 }, { name: "Thera", hours: 18 }, { name: "Administration", hours: 15 }],
  },
  {
    id: "inv-4",
    year: 2025, month: 11, half: "first",
    totalHours: 44.0, totalAmount: 2200, status: "paid", hasFile: true,
    projects: [{ name: "Gazyva", hours: 18 }, { name: "Administration", hours: 16 }, { name: "Thera", hours: 10 }],
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"]

function periodLabel(year: number, month: number, half: "first" | "second"): string {
  const lastDay = half === "first" ? 14 : new Date(year, month + 1, 0).getDate()
  return `${MONTH_SHORT[month]} ${half === "first" ? 1 : 15}–${lastDay}, ${year}`
}

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string }> = {
  draft:     { label: "Draft",     className: "bg-muted text-muted-foreground"           },
  submitted: { label: "Submitted", className: "bg-blue-50 text-blue-700 border-blue-200" },
  paid:      { label: "Paid",      className: "bg-green-50 text-green-700 border-green-200" },
}

const PROJECT_COLORS = [
  "#6366f1","#22c55e","#f97316","#0ea5e9","#ec4899","#8b5cf6","#14b8a6","#f43f5e",
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
  const paidInvoices = INVOICES.filter(inv => inv.status === "paid")
  const totalHours    = paidInvoices.reduce((s, inv) => s + inv.totalHours, 0)
  const totalEarnings = paidInvoices.reduce((s, inv) => s + inv.totalAmount, 0)
  const avgPerInvoice = paidInvoices.length ? Math.round(totalEarnings / paidInvoices.length) : 0

  // Group by year-month for the monthly overview
  const byMonth: Record<string, Invoice[]> = {}
  INVOICES.forEach(inv => {
    const key = `${inv.year}-${String(inv.month).padStart(2, "0")}`
    if (!byMonth[key]) byMonth[key] = []
    byMonth[key].push(inv)
  })
  const sortedMonths = Object.entries(byMonth).sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card px-8 py-5">
        <h1 className="text-2xl font-heading font-bold text-foreground">Invoices</h1>
        <p className="text-sm text-muted-foreground mt-0.5">All-time billing history and earnings</p>
      </div>

      <div className="px-8 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <StatCard
            icon={<DollarSign className="w-4 h-4 text-green-600" />}
            iconBg="bg-green-100"
            label="Total Earned"
            value={`$${totalEarnings.toLocaleString()}`}
            sub="lifetime earnings"
          />
          <StatCard
            icon={<Clock className="w-4 h-4 text-blue-600" />}
            iconBg="bg-blue-100"
            label="Hours Logged"
            value={`${totalHours.toFixed(0)}`}
            sub="across all invoices"
          />
          <StatCard
            icon={<FileText className="w-4 h-4 text-violet-600" />}
            iconBg="bg-violet-100"
            label="Invoices"
            value={String(INVOICES.length)}
            sub={`${paidInvoices.length} paid`}
          />
          <StatCard
            icon={<TrendingUp className="w-4 h-4 text-orange-600" />}
            iconBg="bg-orange-100"
            label="Avg per Invoice"
            value={`$${avgPerInvoice.toLocaleString()}`}
            sub="per billing period"
          />
        </div>

        <div className="grid grid-cols-[1fr_320px] gap-6 items-start">
          {/* Invoice list */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">Invoice History</h2>
            {INVOICES.map(invoice => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>

          {/* Monthly overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Monthly Overview</h2>
            </div>
            <div className="space-y-3">
              {sortedMonths.map(([key, invoices]) => {
                const [year, month] = key.split("-").map(Number)
                const monthTotal = invoices.reduce((s, inv) => s + inv.totalAmount, 0)
                const monthHours = invoices.reduce((s, inv) => s + inv.totalHours, 0)
                const maxThisYear = Math.max(...sortedMonths.map(([, invs]) => invs.reduce((s, i) => s + i.totalAmount, 0)))
                const barPct = maxThisYear > 0 ? (monthTotal / maxThisYear) * 100 : 0

                return (
                  <div key={key} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">
                          {MONTH_NAMES[month]} {year}
                        </h3>
                        <p className="text-xs text-muted-foreground">{monthHours.toFixed(0)}h logged</p>
                      </div>
                      <p className="text-sm font-bold text-foreground">
                        {monthTotal > 0 ? `$${monthTotal.toLocaleString()}` : "—"}
                      </p>
                    </div>
                    {monthTotal > 0 && (
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-3">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${barPct}%` }}
                        />
                      </div>
                    )}
                    <div className="flex gap-2">
                      {invoices
                        .sort((a, b) => (a.half === "first" ? -1 : 1))
                        .map(inv => (
                          <div
                            key={inv.id}
                            className={cn(
                              "flex-1 rounded-lg p-2.5 border",
                              inv.status === "paid"
                                ? "bg-green-50 border-green-200"
                                : inv.status === "submitted"
                                ? "bg-blue-50 border-blue-200"
                                : "bg-muted border-border"
                            )}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              {inv.status === "paid"
                                ? <CheckCircle2 className="w-3 h-3 text-green-600" />
                                : <Circle className="w-3 h-3 text-muted-foreground" />
                              }
                              <p className="text-[10px] font-medium text-muted-foreground">
                                {inv.half === "first" ? "1–14" : "15–end"}
                              </p>
                            </div>
                            <p className="text-sm font-bold text-foreground">
                              {inv.totalAmount > 0 ? `$${inv.totalAmount.toLocaleString()}` : "—"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {inv.totalHours > 0 ? `${inv.totalHours}h` : "In progress"}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  icon, iconBg, label, value, sub,
}: {
  icon: React.ReactNode
  iconBg: string
  label: string
  value: string
  sub: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          {icon}
        </div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  )
}

function InvoiceCard({ invoice }: { invoice: Invoice }) {
  const status = STATUS_CONFIG[invoice.status]
  const allProjects = invoice.projects
  const maxHours    = Math.max(...allProjects.map(p => p.hours), 1)

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-foreground">
              {periodLabel(invoice.year, invoice.month, invoice.half)}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {invoice.half === "first" ? "First half" : "Second half"}
              {invoice.totalHours > 0 ? ` · ${invoice.totalHours}h` : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-xs px-2.5 py-0.5 rounded-full font-medium border", status.className)}>
            {status.label}
          </span>
          <p className="font-bold text-foreground text-lg">
            {invoice.totalAmount > 0
              ? `$${invoice.totalAmount.toLocaleString()}`
              : <span className="text-muted-foreground text-sm">In progress</span>
            }
          </p>
        </div>
      </div>

      {/* Project breakdown bars */}
      {allProjects.length > 0 && (
        <div className="mb-4 space-y-1.5">
          {allProjects.map((project, i) => (
            <div key={project.name} className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-24 truncate">{project.name}</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(project.hours / maxHours) * 100}%`,
                    background: PROJECT_COLORS[i % PROJECT_COLORS.length],
                  }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{project.hours}h</span>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-2 text-xs",
            invoice.hasFile && "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
          )}
          disabled={!invoice.hasFile && invoice.status === "draft"}
        >
          <Upload className="w-3.5 h-3.5" />
          {invoice.hasFile ? "View Invoice" : "Upload Invoice"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 text-xs"
          disabled={invoice.totalHours === 0}
        >
          <FileText className="w-3.5 h-3.5" />
          PDF Summary
        </Button>
      </div>
    </div>
  )
}
