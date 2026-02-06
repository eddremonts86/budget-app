'use client'

import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'

interface FeatureCardProps {
  icon: LucideIcon
  title: string
  description: string
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card className="group cursor-pointer border border-border/50 bg-background/50 p-10 backdrop-blur-xl transition-all duration-500 hover:border-border">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.04] transition-all duration-300 group-hover:scale-110 group-hover:bg-foreground/[0.08]">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-4 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="text-base leading-relaxed text-muted-foreground">{description}</p>
    </Card>
  )
}
