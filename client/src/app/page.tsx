'use client'

import { useHealth } from '@/hooks/use-health'

export default function Home() {
  const { data } = useHealth()
  return <div>{data}</div>
}
