import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'

interface LoginSchema {
  email: string
  password: string
}

async function login(user: LoginSchema) {
  const { data } = await api.post('/auth/login', user)
  return data
}

export function useLogin() {
  return useMutation({
    mutationKey: ['user', 'current'],
    mutationFn: login,
  })
}
