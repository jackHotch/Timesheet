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

export type Period = {
  year?: number
  month?: number
  half?: 'FIRST_HALF' | 'SECOND_HALF'
}

export type Invoice = {
  invoice_id: string
  status: InvoiceStatus
  year: number
  month: number
  period: NonNullable<Period['half']>
  total_hours: string
  total_amount: string
  projects: InvoiceProject[]
  files: InvoiceFile[]
}