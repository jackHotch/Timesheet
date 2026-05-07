import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

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
