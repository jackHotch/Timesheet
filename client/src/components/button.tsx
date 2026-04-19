import { cn } from '@/lib/utils'
import { cva } from 'class-variance-authority'
import { CSSProperties, ReactNode } from 'react'

interface ButtonProps {
  classname?: CSSProperties
  children?: ReactNode
}

const buttonVariants = cva('text-sm font-medium inline-flex items-center justify-center outline-none cursor-pointer', {
  variants: {
    variant: {
      default: 'bg-primary text-primary-foreground hover:bg-primary/80',
      outline: 'border-primary hover:border-primary/60 hover:text-foreground',
      secondary: '',
    },
  },
})

export const Button = ({ classname, children }: ButtonProps) => {
  return <button className={cn('bg-primary text-primary-foreground', classname)}>{children}</button>
}
