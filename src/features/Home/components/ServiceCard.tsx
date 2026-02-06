'use client'

import { motion } from 'framer-motion'
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
    <Card className="group relative h-full border-2 p-6 transition-all hover:border-primary hover:shadow-xl">
      {badge && <Badge className="absolute -right-2 -top-2">{badge}</Badge>}
      <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 transition-transform group-hover:scale-110">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="mb-4 text-muted-foreground">{description}</p>
      <Button variant="ghost" size="sm" className="group/btn">
        {ctaText}
        <motion.span className="ml-1 inline-block" whileHover={{ x: 5 }}>
          →
        </motion.span>
      </Button>
    </Card>
  )
}
