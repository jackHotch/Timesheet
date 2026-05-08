import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { INVOICE_STATUS_OPTIONS } from './constants'
import { InvoiceStatus } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export function getInvoiceChartColor(status: InvoiceStatus | undefined): string {
  if (!status) return 'var(--border)'
  return INVOICE_STATUS_OPTIONS.find((o) => o.value === status)?.dotColor ?? 'var(--border)'
}