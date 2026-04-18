import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

async function fetchHealth() {
  const { data } = await api.get<string>('/')
  return data
}

export function useHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: fetchHealth,
  })
}
