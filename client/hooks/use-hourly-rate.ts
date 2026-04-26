import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

async function fetchHourlyRate() {
  const { data } = await api.get('/configuration/hourly-rate')
  return data
}

export function useHourlyRate() {
  return useQuery({
    queryKey: ['hourly rate'],
    queryFn: fetchHourlyRate,
  })
}
