import type { StatusOption } from '@/components/ui/status-dropdown'

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