import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import type { StatusOption } from '@/components/ui/status-dropdown'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export const INVOICE_STATUS_OPTIONS: StatusOption[] = [
  {
    value: 'draft',   label: 'Draft',
    dotColor: '#9ca3af', bgColor: '#eeeeee', textColor: '#868686',
    darkDotColor: '#9ca3af', darkBgColor: '#2e2e2e', darkTextColor: '#a0a0a0',
  },
  {
    value: 'sent',    label: 'Sent',
    dotColor: '#3b82f6', bgColor: '#e2f4fe', textColor: '#4488db',
    darkDotColor: '#60a5fa', darkBgColor: '#1a2d4a', darkTextColor: '#7ab3f5',
  },
  {
    value: 'paid',    label: 'Paid',
    dotColor: '#22c55e', bgColor: '#d9fadf', textColor: '#44995b',
    darkDotColor: '#4ade80', darkBgColor: '#18332a', darkTextColor: '#5dbb78',
  },
  {
    value: 'overdue', label: 'Overdue',
    dotColor: '#ef4444', bgColor: '#fae4df', textColor: '#db4643',
    darkDotColor: '#f87171', darkBgColor: '#3a1a1a', darkTextColor: '#f07070',
  },
]

export type InvoiceFile = {
  id: string
  fileType: string
  fileName: string
  s3Key: string
}

export type InvoiceProject = {
  name: string
  colorIndex: number
  hours: number
}

export type Invoice = {
  invoice_id: string
  status: InvoiceStatus
  year: number
  month: number
  period: 'FIRST_HALF' | 'SECOND_HALF'
  total_hours: string
  total_amount: string
  projects: InvoiceProject[]
  files: InvoiceFile[]
}

type Period = {
  year?: number
  month?: number
  half?: 'first' | 'second'
}

function invoiceQueryKey(period: Period) {
  return ['invoice', period.year, period.month, period.half]
}

export function useInvoicesForPeriod(period: Period) {
  return useQuery<Invoice[] | null>({
    queryKey: invoiceQueryKey(period),
    queryFn: () =>
      api
        .get('/invoices', {
          params: { year: period.year, month: period.month, half: period.half },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useUpdateInvoiceStatus(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      api.patch(`/invoices/${id}`, { status }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<Invoice[] | null>(invoiceQueryKey(period), (old) =>
        old ? old.map((inv) => inv.invoice_id === data.id ? { ...inv, status: data.status } : inv) : old
      )
    },
  })
}
