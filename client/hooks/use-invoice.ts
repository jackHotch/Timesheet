import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Period, Invoice, InvoiceStatus, Half } from '@/lib/types'

function invoiceQueryKey(period: Period) {
  return ['invoice', period.year, period.month, period.half]
}

export function useInvoicesForPeriod(period: Period | null) {
  return useQuery<Invoice[] | null>({
    queryKey: invoiceQueryKey(period ?? {}),
    queryFn: () =>
      api
        .get('/invoices', {
          params: { year: period!.year, month: period!.month, half: period!.half },
        })
        .then((r) => r.data),
    enabled: period !== null,
    staleTime: 30_000,
  })
}

export function useInvoiceById(id: string | null) {
  return useQuery<{ year: number; month: number; period: Half } | null>({
    queryKey: ['invoice', 'by-id', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useUpdateInvoiceStatus(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: InvoiceStatus }) =>
      api.patch(`/invoices/${id}`, { status }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', period.year] })
    },
  })
}

export function useDeleteInvoiceFile(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fileId: string) => api.delete(`/files/${fileId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', period.year] })
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useGenerateInvoiceSummary(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (invoiceId: string) => api.post(`/invoices/${invoiceId}/summary`).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', period.year] })
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}

export function useUploadInvoiceFile(period: Period) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      invoiceId,
      fileType,
      file,
    }: {
      invoiceId: string
      fileType: 'invoice' | 'summary'
      file: File
    }) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileType', fileType)
      return api
        .post(`/invoices/${invoiceId}/files`, formData, {
          headers: { 'Content-Type': undefined },
        })
        .then((r) => r.data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice', period.year] })
      queryClient.invalidateQueries({ queryKey: ['files'] })
    },
  })
}
