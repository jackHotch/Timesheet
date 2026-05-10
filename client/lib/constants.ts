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


export const PROJECT_COLORS = [
  {
    dot: '#6366f1',
    header: 'text-indigo-600',
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    dot: '#22c55e',
    header: 'text-green-600',
    badge: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    dot: '#f97316',
    header: 'text-orange-600',
    badge: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    dot: '#0ea5e9',
    header: 'text-sky-600',
    badge: 'bg-sky-50 text-sky-700 border-sky-200',
  },
  {
    dot: '#ec4899',
    header: 'text-pink-600',
    badge: 'bg-pink-50 text-pink-700 border-pink-200',
  },
  {
    dot: '#8b5cf6',
    header: 'text-violet-600',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  {
    dot: '#14b8a6',
    header: 'text-teal-600',
    badge: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    dot: '#f43f5e',
    header: 'text-rose-600',
    badge: 'bg-rose-50 text-rose-700 border-rose-200',
  },
]

export const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']