import './globals.css'
import { ThemeProvider } from '@/components/utils/theme-provider'
import QueryProvider from '@/providers/query-provider'
import { cn } from '@/lib/utils'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn('antialiased', 'font-sans')}>
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  )
}
