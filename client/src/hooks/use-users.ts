import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

async function fetchUsers() {
  const { data } = await api.get('/users')
  return data
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  })
}
