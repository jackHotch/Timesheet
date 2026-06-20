'use client'

import { useState, useMemo } from 'react'
import { useFiles, useFileStats } from '@/hooks/use-files'
import { FilterTabs, type FilterOption } from '@/components/common/filters'
import { FileRecord, FileType, Half, InvoiceStatus } from '@/lib/types'
import { INVOICE_STATUS_OPTIONS, MONTH_SHORT } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { Eye, Download, MoreHorizontal, FileText, FileSpreadsheet, Upload } from 'lucide-react'

type TypeFilter = 'all' | FileType

function getInvoiceDisplayId(year: number, month: number, period: Half): string {
  return `INV-${year}-${String(month).padStart(2, '0')}${period === Half.FIRST_HALF ? '1' : '2'}`
}

function getPeriodLabel(year: number, month: number, period: Half): string {
  const monthName = MONTH_SHORT[month - 1]
  const lastDay = new Date(year, month, 0).getDate()
  return `${monthName} ${period === Half.FIRST_HALF ? `1–14` : `15–${lastDay}`}, ${year}`
}

function StatusBadge({ status }: { status: InvoiceStatus }) {
  const option = INVOICE_STATUS_OPTIONS.find((o) => o.value === status)
  if (!option) return null
  return (
    <span
      className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ backgroundColor: option.bgColor, color: option.textColor }}
    >
      <span className="size-1.5 rounded-full shrink-0" style={{ backgroundColor: option.dotColor }} />
      {option.label}
    </span>
  )
}

function TypeBadge({ type }: { type: FileType }) {
  const isInvoice = type === 'invoice'
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-1 text-xs font-medium',
        isInvoice
          ? 'bg-rose-50 text-rose-600'
          : 'bg-violet-50 text-violet-600'
      )}
    >
      {isInvoice ? 'Invoice' : 'Summary'}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">{label}</p>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
    </div>
  )
}

export default function FilesPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all')
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [search, setSearch] = useState('')

  const { data: files = [] } = useFiles()
  const { data: stats } = useFileStats()

  const availableYears = useMemo(() => {
    const years = [...new Set(files.map((f) => f.year))].sort((a, b) => b - a)
    return years
  }, [files])

  const filtered = useMemo(() => {
    return files.filter((f: FileRecord) => {
      if (typeFilter !== 'all' && f.file_type !== typeFilter) return false
      if (statusFilter !== 'all' && f.status !== statusFilter) return false
      if (yearFilter !== 'all' && f.year !== Number(yearFilter)) return false
      if (search && !f.file_name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [files, typeFilter, statusFilter, yearFilter, search])

  const typeOptions: FilterOption<TypeFilter>[] = [
    { label: 'All', value: 'all' },
    { label: 'Invoices', value: 'invoice' },
    { label: 'Summaries', value: 'summary' },
  ]

  return (
    <div className="min-h-screen p-8 flex flex-col gap-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">Files</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">All invoice PDFs and summary documents.</p>
        </div>
        <button
          disabled
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground opacity-50 cursor-not-allowed"
        >
          <Upload size={15} />
          Upload file
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Files" value={stats ? `${stats.total} of ${stats.total}` : '—'} />
        <StatCard label="Invoices" value={stats?.invoice_count ?? '—'} />
        <StatCard label="Summaries" value={stats?.summary_count ?? '—'} />
      </div>

      <div className="card flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-border bg-muted/50 py-2 pl-9 pr-3 text-sm outline-none focus:border-ring placeholder:text-muted-foreground"
          />
        </div>

        <FilterTabs options={typeOptions} value={typeFilter} onChange={setTypeFilter} />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | 'all')}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="all">Any status</option>
          {INVOICE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="all">Any year</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Name</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Type</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Invoice</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">Status</th>
              <th className="px-5 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                <span className="flex items-center gap-1">
                  Uploaded
                  <svg width="10" height="10" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                </span>
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                  No files found
                </td>
              </tr>
            ) : (
              filtered.map((file) => {
                const FileIcon = file.file_type === 'invoice' ? FileText : FileSpreadsheet
                const invoiceId = getInvoiceDisplayId(file.year, file.month, file.period)
                const periodLabel = getPeriodLabel(file.year, file.month, file.period)
                const uploadedDate = new Date(file.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })

                return (
                  <tr key={file.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold',
                          file.file_type === 'invoice'
                            ? 'bg-rose-100 text-rose-600'
                            : 'bg-violet-100 text-violet-600'
                        )}>
                          PDF
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{file.file_name}</p>
                          <p className="text-xs text-muted-foreground">{periodLabel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <TypeBadge type={file.file_type} />
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-mono text-xs text-muted-foreground">{invoiceId}</span>
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={file.status} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground whitespace-nowrap">{uploadedDate}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          title="View"
                          disabled
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          title="Download"
                          disabled
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Download size={15} />
                        </button>
                        <button
                          title="More"
                          disabled
                          className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <MoreHorizontal size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
