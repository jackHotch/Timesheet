'use client'

import { useMemo } from 'react'
import { Half, Invoice } from '@/lib/types'
import { MONTH_SHORT } from '@/lib/constants'

interface EarningsChartProps {
  invoices: Invoice[]
  rate?: number
}

interface Point {
  x: number
  y: number
}

const VW = 600
const VH = 200
const PAD = { top: 12, right: 8, bottom: 28, left: 48 }
const chartW = VW - PAD.left - PAD.right
const chartH = VH - PAD.top - PAD.bottom

function periodOrder(inv: Invoice): number {
  return (inv.year * 100 + inv.month) * 2 + (inv.period === Half.FIRST_HALF ? 0 : 1)
}

function niceMax(val: number): number {
  if (val <= 0) return 5000
  const magnitude = Math.pow(10, Math.floor(Math.log10(val)))
  const normalized = val / magnitude
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return nice * magnitude
}

function smoothPath(pts: Point[], tension = 0.4): string {
  if (pts.length === 0) return ''
  if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`
  const n = pts.length
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(i - 1, 0)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(i + 2, n - 1)]
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = p1.y + (p2.y - p0.y) * tension
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = p2.y - (p3.y - p1.y) * tension
    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`
  }
  return d
}

function formatShort(val: number): string {
  if (val >= 1000) return `$${(val / 1000 % 1 === 0 ? (val / 1000).toFixed(0) : (val / 1000).toFixed(1))}k`
  return `$${val}`
}

export function EarningsChart({ invoices, rate }: EarningsChartProps) {
  const { periods, points, maxY, xLabels } = useMemo(() => {
    const sorted = [...invoices].sort((a, b) => periodOrder(a) - periodOrder(b))
    const periods = sorted.slice(-12)

    if (periods.length === 0) {
      return { periods: [], points: [], maxY: 5000, xLabels: [] }
    }

    const amounts = periods.map((inv) => parseFloat(inv.total_amount))
    const maxAmount = Math.max(...amounts)
    const maxY = niceMax(maxAmount)

    const n = periods.length
    const xStep = n > 1 ? chartW / (n - 1) : 0
    const yScale = chartH / maxY

    const pts: Point[] = periods.map((inv, i) => ({
      x: PAD.left + i * xStep,
      y: PAD.top + chartH - parseFloat(inv.total_amount) * yScale,
    }))

    const xLabels: { x: number; label: string }[] = []
    let lastMonth = -1
    periods.forEach((inv, i) => {
      if (inv.month !== lastMonth) {
        lastMonth = inv.month
        xLabels.push({ x: pts[i].x, label: `${MONTH_SHORT[inv.month - 1]} 1` })
      }
    })

    return { periods, points: pts, maxY, xLabels }
  }, [invoices])

  const midY = maxY / 2
  const yBaseline = PAD.top + chartH

  function yOf(val: number) {
    return PAD.top + chartH - (val / maxY) * chartH
  }

  const yTop = yOf(maxY)
  const yMid = yOf(midY)
  const y0 = yOf(0)

  const linePath = smoothPath(points)
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)} ${yBaseline} L ${points[0].x.toFixed(2)} ${yBaseline} Z`
      : ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold">Earnings over time</p>
          <p className="text-xs text-muted-foreground">Last 12 invoice periods</p>
        </div>
        {rate != null && (
          <div className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Hours × $ {rate}
          </div>
        )}
      </div>

      {periods.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          No data yet
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <svg viewBox={`0 0 ${VW} ${VH}`} width="100%" className="overflow-visible">
            {/* Grid lines */}
            <line x1={PAD.left} y1={yTop} x2={VW - PAD.right} y2={yTop} stroke="var(--border)" strokeWidth="1" />
            <line x1={PAD.left} y1={yMid} x2={VW - PAD.right} y2={yMid} stroke="var(--border)" strokeWidth="1" />
            <line x1={PAD.left} y1={y0} x2={VW - PAD.right} y2={y0} stroke="var(--border)" strokeWidth="1" />

            {/* Y-axis labels */}
            <text x={PAD.left - 6} y={yTop} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--muted-foreground)">
              {formatShort(maxY)}
            </text>
            <text x={PAD.left - 6} y={yMid} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--muted-foreground)">
              {formatShort(midY)}
            </text>
            <text x={PAD.left - 6} y={y0} textAnchor="end" dominantBaseline="middle" fontSize="10" fill="var(--muted-foreground)">
              $0
            </text>

            {/* Area fill */}
            <path d={areaPath} fill="var(--primary)" fillOpacity="0.12" stroke="none" />

            {/* Line */}
            <path
              d={linePath}
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data point circles */}
            {points.map((pt, i) => (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r="3.5"
                fill="var(--card)"
                stroke="var(--primary)"
                strokeWidth="1.5"
              />
            ))}

            {/* X-axis labels */}
            {xLabels.map(({ x, label }, i) => (
              <text
                key={i}
                x={x}
                y={VH - 4}
                textAnchor="middle"
                fontSize="10"
                fill="var(--muted-foreground)"
              >
                {label}
              </text>
            ))}
          </svg>
        </div>
      )}
    </div>
  )
}
