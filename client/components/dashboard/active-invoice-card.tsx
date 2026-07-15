'use client'

import { Half, Invoice, InvoiceStatus } from '@/lib/types'
import { StatusDropdown } from '@/components/ui/status-dropdown'
import { useUpdateInvoiceStatus } from '@/hooks/use-invoice'
import { formatCurrency } from '@/lib/utils'
import { PROJECT_COLORS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

function formatPeriod(year: number, month: number, half: Half): string {
  const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'long' })
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthName} ${half === Half.FIRST_HALF ? '1–14' : `15–${lastDay}`}, ${year}`
}

interface ActiveInvoiceCardProps {
  invoice: Invoice | undefined
}

export function ActiveInvoiceCard({ invoice }: ActiveInvoiceCardProps) {
  const router = useRouter()
  const updateStatus = useUpdateInvoiceStatus(
    invoice
      ? { year: invoice.year, month: invoice.month, half: invoice.period }
      : { year: 0, month: 0 }
  )

  if (!invoice) {
    return (
      <div className="card h-full flex items-center justify-center text-sm text-muted-foreground">
        No active invoice
      </div>
    )
  }

  const totalHours = parseFloat(invoice.total_hours)

  return (
    <div className="card h-full flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-semibold">Active invoice</p>
          <p className="text-xs text-muted-foreground">{invoice.invoice_id}</p>
        </div>
        <div onClick={(e) => e.stopPropagation()}>
          <StatusDropdown
            value={invoice.status}
            onChange={(status) =>
              updateStatus.mutate({ id: invoice.invoice_id, status: status as InvoiceStatus })
            }
          />
        </div>
      </div>

      <div>
        <p className="text-sm text-muted-foreground">
          {formatPeriod(invoice.year, invoice.month, invoice.period)}
        </p>
        <p className="mt-1 text-4xl font-bold">
          {formatCurrency(parseFloat(invoice.total_amount))}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalHours} hours across {invoice.projects.length} projects
        </p>
      </div>

      <div className="flex flex-col gap-3 flex-1">
        {invoice.projects.map((project, i) => {
          const color = PROJECT_COLORS[project.colorIndex % PROJECT_COLORS.length]
          const pct = totalHours > 0 ? (project.hours / totalHours) * 100 : 0
          return (
            <div key={i}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: color.dot }} />
                  <span className="text-sm">{project.name}</span>
                </div>
                <span className="text-sm text-muted-foreground">{project.hours}h</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: color.dot }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex gap-2 pt-2">
        <Button
          className="flex-1 h-9"
          size="lg"
          onClick={() => router.push('/timesheet')}
        >
          Open timesheet
        </Button>
      </div>
    </div>
  )
}
