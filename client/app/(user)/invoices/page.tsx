'use client'

import { useState } from "react"
import { YearPicker } from "@/components/ui/year-picker"
import { useInvoicesForPeriod } from "@/hooks/use-invoice"
import { formatCurrency, getInvoiceChartColor } from "@/lib/utils"
import { Invoice } from "@/lib/types"

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function ActivityChart({ invoices, year }: { invoices: Invoice[] | null | undefined; year: string }) {
  const slots: (Invoice | undefined)[] = []
  for (let m = 1; m <= 12; m++) {
    slots.push(invoices?.find((inv) => inv.month === m && inv.period === 'FIRST_HALF'))
    slots.push(invoices?.find((inv) => inv.month === m && inv.period === 'SECOND_HALF'))
  }

  const maxAmount = slots.reduce((max, inv) => {
    if (!inv) return max
    return Math.max(max, parseFloat(inv.total_amount))
  }, 0)

  return (
    <div className="flex flex-col h-full w-full">
      <p className="text-sm font-semibold mb-4">Activity · {year}</p>
      <div className="flex flex-1 flex-col gap-2 min-h-0">
        <div className="flex flex-1 items-end gap-0.75 min-h-0">
          {slots.map((inv, i) => {
            const amount = inv ? parseFloat(inv.total_amount) : 0
            const heightPct = maxAmount > 0 ? (amount / maxAmount) * 100 : 0
            const isNoInvoice = !inv
            return (
              <div key={i} className="flex flex-1 flex-col items-center justify-end h-full group relative">
                {inv && (
                  <div className="absolute bottom-full mb-1.5 z-10 hidden group-hover:flex flex-col items-center pointer-events-none">
                    <div className="rounded-md bg-popover border border-border px-2.5 py-1.5 shadow-md text-xs whitespace-nowrap">
                      <p className="font-semibold">{formatCurrency(parseFloat(inv.total_amount))}</p>
                      <p className="text-muted-foreground capitalize">{inv.status}</p>
                    </div>
                  </div>
                )}
                <div
                  className="w-full rounded-[3px] transition-opacity"
                  style={{
                    height: isNoInvoice ? '4px' : `${Math.max(heightPct, 2)}%`,
                    backgroundColor: getInvoiceChartColor(inv?.status),
                    opacity: isNoInvoice ? 0.25 : 1,
                  }}
                />
              </div>
            )
          })}
        </div>
        <div className="flex gap-0.75">
          {MONTH_LABELS.map((label) => (
            <div key={label} className="flex flex-2 justify-start pl-px">
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex gap-4 mt-3 pt-3 border-t border-border">
        {[
          { color: getInvoiceChartColor('paid'), label: 'Paid' },
          { color: getInvoiceChartColor('sent'), label: 'Open' },
          { color: getInvoiceChartColor('draft'), label: 'Draft' },
          { color: getInvoiceChartColor('overdue'), label: 'Overdue' },
          { color: 'var(--border)', label: 'No invoice', opacity: 0.6 },
        ].map(({ color, label, opacity }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: color, opacity: opacity ?? 1 }} />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Invoices() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))

  const { data: invoices } = useInvoicesForPeriod({ year: Number(year) })

  const totalEarned = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) ?? 0
  const totalHours = invoices?.reduce((sum, inv) => sum + parseFloat(inv.total_hours), 0) ?? 0
  const totalPaid = invoices?.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) ?? 0
  const totalOutstanding = invoices?.filter((inv) => inv.status === 'sent' || inv.status === 'overdue').reduce((sum, inv) => sum + parseFloat(inv.total_amount), 0) ?? 0

  return (
    <div className="min-h-screen p-8 flex flex-col gap-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">Invoices</h1>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">All invoice periods, with totals and status.</p>
          </div>
          <YearPicker value={year} onChange={setYear} />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-2 card" style={{ minHeight: '180px' }}>
          <ActivityChart invoices={invoices} year={year} />
        </div>
        <div className="flex flex-1 card flex-col gap-2">
          <p className="font-semibold">Totals</p>

          <div className="flex items-center justify-between">
            <span className="text-description">Earned</span>
            <span className="font-bold text-lg">{formatCurrency(totalEarned)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-description">Hours</span>
            <span>{totalHours}</span>
          </div>

          <hr />

          <div className="flex items-center justify-between">
            <span className="text-sm">Paid</span>
            <span className="text-sm">{formatCurrency(totalPaid)}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">Outstanding</span>
            <span className="text-sm">{formatCurrency(totalOutstanding)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Invoices
