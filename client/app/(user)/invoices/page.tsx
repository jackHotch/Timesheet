'use client'

import { useState } from "react"
import { YearPicker } from "@/components/ui/year-picker"
import { useInvoicesForPeriod } from "@/hooks/use-invoice"
import { InvoiceChart } from "@/components/invoices/invoice-chart"
import { TotalsCard } from "@/components/invoices/totals-card"

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
          <InvoiceChart invoices={invoices} year={year} />
        </div>

        <TotalsCard 
          totalEarned={totalEarned} 
          totalHours={totalHours} 
          totalPaid={totalPaid} 
          totalOutstanding={totalOutstanding} 
        />

      </div>
      <div className="card">hello</div>
    </div>
  )
}

export default Invoices
