import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Period, Invoice, InvoiceStatus } from '@/lib/types'

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
