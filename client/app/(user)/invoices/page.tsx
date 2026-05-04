'use client'

import { useState } from "react"
import { YearPicker } from "@/components/ui/year-picker"

function Invoices() {
  const [year, setYear] = useState<string>(String(new Date().getFullYear()))

  return (
    <div className="min-h-screen p-8 flex flex-col gap-4">
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl font-bold text-foreground">Timesheet</h1>
            </div>

            <p className="mt-0.5 text-sm text-muted-foreground">All invoice periods, with totals and status.</p>
          </div>

          <YearPicker value={year} onChange={setYear} />
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex flex-2 items-center justify-between card">
          <p className="text-sm font-semibold">Activity · {year}</p>
          <p className="text-description">number of invoices</p>
        </div>
        <div className="flex flex-1 card flex-col">
          <p className="text-sm font-semibold">Totals</p>

          <div>
            <span className="text-description">Earned</span>
            <span></span>
          </div>

          <div>
            <span className="text-description">Hours</span>
            <span></span>
          </div>
          <hr />

          <div>
            <span className="text-sm">Paid</span>
            <span className="text-sm"></span>
          </div>

          <div>
            <span className="text-sm">Outstanding</span>
            <span className="text-sm"></span>
          </div>
        </div>

      </div>

      <div className="card"> Filters</div>
    </div>
  )
}

export default Invoices
