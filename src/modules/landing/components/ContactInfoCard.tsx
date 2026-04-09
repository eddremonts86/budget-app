'use client'

import { m } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui'

interface ContactInfoCardProps {
  icon: LucideIcon
  label: string
  value: string
  href: string
  index: number
}

export function ContactInfoCard({ icon: Icon, label, value, href, index }: ContactInfoCardProps) {
  return (
    <m.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
    >
      <Card className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/60 p-4 transition-all duration-300 hover:border-foreground/20 hover:shadow-md hover:-translate-y-1 backdrop-blur-sm sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <a href={href} className="relative z-10 flex items-center gap-4">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="mb-1 font-semibold text-foreground">{label}</h3>
            <p className="text-sm text-muted-foreground transition-colors group-hover:text-foreground/80">
              {value}
            </p>
          </div>
        </a>
      </Card>
    </m.div>
  )
}
