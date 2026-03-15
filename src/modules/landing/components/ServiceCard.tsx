'use client'

import { m } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Badge, Card, Button } from '@/components/ui'

interface ServiceCardProps {
  icon: LucideIcon
  title: string
  description: string
  badge?: string
  ctaText: string
}

export function ServiceCard({ icon: Icon, title, description, badge, ctaText }: ServiceCardProps) {
  return (
    <Card className="group relative h-full border border-border/50 bg-background/50 p-6 backdrop-blur-xl transition-all duration-500 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5">
      {badge && <Badge className="absolute -right-2 -top-2">{badge}</Badge>}
      <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary/20">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <Button variant="ghost" size="sm" className="group/btn">
        {ctaText}
        <m.span className="ml-1 inline-block" whileHover={{ x: 5 }}>
          →
        </m.span>
      </Button>
    </Card>
  )
}
