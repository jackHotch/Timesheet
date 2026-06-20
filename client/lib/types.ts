export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue'

export enum Half {
  FIRST_HALF = 'FIRST_HALF',
  SECOND_HALF = 'SECOND_HALF',
}

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

export type Period = {
  year?: number
  month?: number
  half?: Half
}

export type Invoice = {
  invoice_id: string
  status: InvoiceStatus
  year: number
  month: number
  period: Half
  total_hours: string
  total_amount: string
  projects: InvoiceProject[]
  files: InvoiceFile[]
}

export type FileType = 'invoice' | 'summary'

export type FileRecord = {
  id: string
  file_name: string
  file_type: FileType
  s3_key: string
  created_at: string
  invoice_id: string
  year: number
  month: number
  period: Half
  status: InvoiceStatus
}

export type FileStats = {
  total: string
  invoice_count: string
  summary_count: string
}