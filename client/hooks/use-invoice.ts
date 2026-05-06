import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export type Invoice = {
  id: string
  status: InvoiceStatus
}

type Period = {
  year: number
  month: number
  half: 'first' | 'second'
}

function invoiceQueryKey(period: Period) {
  return ['invoice', period.year, period.month, period.half]
}

export function useInvoiceForPeriod(period: Period) {
  return useQuery<Invoice | null>({
    queryKey: invoiceQueryKey(period),
    queryFn: () =>
      api
        .get('/invoices/period', {
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
      api.patch(`/invoices/${id}/status`, { status }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData<Invoice | null>(invoiceQueryKey(period), (old) =>
        old ? { ...old, status: data.status } : old
      )
    },
  })
}
