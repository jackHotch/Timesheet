'use client'

import { Button } from '@/components/button'
import { Clock } from 'lucide-react'
import Image from 'next/image'

export default function Login() {
  return (
    <div className='flex h-screen w-screen'>
      <div className='bg-card rounded-r-4xl w-[50vw] h-full p-8'>
        <div className='flex items-center gap-2'>
          <Clock color='var(--primary)' size={24} />
          <h1 className='text-primary text-3xl font-bold'>Timesheet</h1>
        </div>

        <div>
          <Button>Login</Button>
        </div>
      </div>
      <div className='h-full w-[60vw]'>
        <img src='/login-illustration.svg' alt='image' width='100%' height='100vh' />
      </div>
    </div>
  )
}
