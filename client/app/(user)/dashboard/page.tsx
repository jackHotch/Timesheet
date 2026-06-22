'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useInvoicesForPeriod } from '@/hooks/use-invoice'
import { useHourlyRate } from '@/hooks/use-hourly-rate'
import { useUsers } from '@/hooks/use-users'
import { Half, Invoice, InvoiceStatus } from '@/lib/types'
import { formatCurrency } from '@/lib/utils'
import { INVOICE_STATUS_OPTIONS } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import { InvoiceCard } from '@/components/invoices/invoice-card'
import { StatCard } from '@/components/dashboard/stat-card'
import { EarningsChart } from '@/components/dashboard/earnings-chart'
import { ActiveInvoiceCard } from '@/components/dashboard/active-invoice-card'
import { FileText, ChevronRight } from 'lucide-react'

const currentYear = new Date().getFullYear()

function periodOrder(inv: Invoice): number {
  return (inv.year * 100 + inv.month) * 2 + (inv.period === Half.FIRST_HALF ? 0 : 1)
}

function formatPeriodLabel(year: number, month: number, half: Half): string {
  const monthName = new Date(0, month - 1).toLocaleString('default', { month: 'short' })
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthName} ${half === Half.FIRST_HALF ? '1–14' : `15–${lastDay}`}, ${year}`
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const el = document.documentElement
    setDark(el.classList.contains('dark'))
    const observer = new MutationObserver(() => setDark(el.classList.contains('dark')))
    observer.observe(el, { attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  const opt = INVOICE_STATUS_OPTIONS.find((o) => o.value === status)
  if (!opt) return null

  const bg = dark ? (opt.darkBgColor ?? opt.bgColor) : opt.bgColor
  const text = dark ? (opt.darkTextColor ?? opt.textColor) : opt.textColor
  const dot = dark ? (opt.darkDotColor ?? opt.dotColor) : opt.dotColor

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: bg, color: text }}
    >
      <span className="size-1.5 rounded-full" style={{ backgroundColor: dot }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function DashboardPage() {
  const router = useRouter()

  const { data: currYearInvoices } = useInvoicesForPeriod({ year: currentYear })
  const { data: prevYearInvoices } = useInvoicesForPeriod({ year: currentYear - 1 })
  const { data: hourlyRateData } = useHourlyRate()
  const { data: users } = useUsers()

  const hourlyRate: number | undefined = useMemo(() => {
    if (hourlyRateData == null) return undefined
    if (typeof hourlyRateData === 'number') return hourlyRateData
    return hourlyRateData?.rate ?? hourlyRateData?.hourly_rate ?? hourlyRateData?.value ?? undefined
  }, [hourlyRateData])

  const firstName = useMemo(() => {
    if (!users) return 'there'
    const user = Array.isArray(users) ? users[0] : users
    const name: string = user?.name ?? user?.display_name ?? user?.username ?? ''
    return name.split(' ')[0] || 'there'
  }, [users])

  const allInvoices = useMemo(() => {
    return [...(prevYearInvoices ?? []), ...(currYearInvoices ?? [])].sort(
      (a, b) => periodOrder(a) - periodOrder(b)
    )
  }, [prevYearInvoices, currYearInvoices])

  const currentInvoice = useMemo(() => {
    const drafts = allInvoices.filter((i) => i.status === 'draft')
    return drafts.length > 0 ? drafts[drafts.length - 1] : allInvoices[allInvoices.length - 1]
  }, [allInvoices])

  const outstanding = useMemo(() => {
    const invoices = (currYearInvoices ?? []).filter(
      (i) => i.status === 'sent' || i.status === 'overdue'
    )
    return {
      amount: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount), 0),
      count: invoices.length,
    }
  }, [currYearInvoices])

  const earnedInYear = useMemo(() => {
    const invoices = currYearInvoices ?? []
    return {
      amount: invoices.reduce((sum, i) => sum + parseFloat(i.total_amount), 0),
      count: invoices.length,
      hours: invoices.reduce((sum, i) => sum + parseFloat(i.total_hours), 0),
    }
  }, [currYearInvoices])

  const lastPayment = useMemo(() => {
    const paid = allInvoices.filter((i) => i.status === 'paid')
    return paid.length > 0 ? paid[paid.length - 1] : undefined
  }, [allInvoices])

  const recentInvoices = useMemo(() => {
    return allInvoices.slice(-4).reverse()
  }, [allInvoices])

  const currentPeriodLabel = currentInvoice
    ? formatPeriodLabel(currentInvoice.year, currentInvoice.month, currentInvoice.period)
    : null

  const lastPaymentLabel = lastPayment
    ? formatPeriodLabel(lastPayment.year, lastPayment.month, lastPayment.period)
    : null

  return (
    <div className="min-h-screen p-8 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Welcome back, {firstName}</h1>
          {currentPeriodLabel && (
            <p className="mt-1 text-sm text-muted-foreground">
              Here&apos;s where things stand for {currentPeriodLabel}.
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="lg" onClick={() => router.push('/invoices')}>
            <FileText />
            All invoices
          </Button>
          <Button size="lg" onClick={() => router.push('/timesheet')}>
            + Log hours
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          label="Current Invoice"
          amount={currentInvoice ? formatCurrency(parseFloat(currentInvoice.total_amount)) : '—'}
          sub={
            currentInvoice ? (
              <>
                <StatusBadge status={currentInvoice.status} />
                <span>· {currentInvoice.total_hours} hrs</span>
              </>
            ) : (
              <span>—</span>
            )
          }
        />
        <StatCard
          label="Outstanding"
          amount={formatCurrency(outstanding.amount)}
          sub={<span>{outstanding.count} sent</span>}
        />
        <StatCard
          label={`Earned in ${currentYear}`}
          amount={formatCurrency(earnedInYear.amount)}
          sub={
            <span>
              {earnedInYear.count} invoices · {earnedInYear.hours} hrs
            </span>
          }
        />
        <StatCard
          label="Last Payment"
          amount={lastPayment ? formatCurrency(parseFloat(lastPayment.total_amount)) : '—'}
          sub={<span>{lastPaymentLabel ?? '—'}</span>}
        />
      </div>

      {/* Chart + Active invoice */}
      <div className="flex gap-4" style={{ minHeight: '340px' }}>
        <div className="card flex-2 flex flex-col">
          <EarningsChart invoices={allInvoices} rate={hourlyRate} />
        </div>
        <div className="flex-1">
          <ActiveInvoiceCard invoice={currentInvoice} />
        </div>
      </div>

      {/* Recent invoices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-foreground">Recent invoices</h2>
            <p className="text-xs text-muted-foreground">Last 4 periods</p>
          </div>
          <button
            className="flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => router.push('/invoices')}
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        {recentInvoices.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {recentInvoices.map((inv) => (
              <InvoiceCard key={inv.invoice_id} invoice={inv} />
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">No invoices yet</p>
        )}
      </div>
    </div>
  )
}
