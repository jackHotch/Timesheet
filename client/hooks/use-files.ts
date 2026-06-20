import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { FileRecord, FileStats, FileType, InvoiceStatus } from '@/lib/types'

interface FilesQueryParams {
  year?: number
  fileType?: FileType
  status?: InvoiceStatus
}

export function useFiles(params: FilesQueryParams = {}) {
  return useQuery<FileRecord[]>({
    queryKey: ['files', params.year, params.fileType, params.status],
    queryFn: () =>
      api
        .get('/files', {
          params: {
            year: params.year,
            fileType: params.fileType,
            status: params.status,
          },
        })
        .then((r) => r.data),
    staleTime: 30_000,
  })
}

export function useFileStats() {
  return useQuery<FileStats>({
    queryKey: ['files', 'stats'],
    queryFn: () => api.get('/files/stats').then((r) => r.data),
    staleTime: 30_000,
  })
}
