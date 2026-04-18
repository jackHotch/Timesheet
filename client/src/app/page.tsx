'use client'

import { useUsers } from '@/hooks/use-users'

export default function Home() {
  const { data } = useUsers()
  return (
    <div>
      {data?.map((user: { first_name: string; last_name: string; email: string }) => (
        <div key={user.email}>{user.first_name} {user.last_name} — {user.email}</div>
      ))}
    </div>
  )
}
