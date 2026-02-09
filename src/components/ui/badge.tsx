'use client'

import { Slot } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/shared/utils/index'
import { badgeVariants, type BadgeVariantProps } from './badge-variants'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, BadgeVariantProps {
  asChild?: boolean
}

function Badge({ className, variant, asChild = false, ...props }: BadgeProps) {
  const Comp = asChild ? Slot.Root : 'div'
  return <Comp className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge }
