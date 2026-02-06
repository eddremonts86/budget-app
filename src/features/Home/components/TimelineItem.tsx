'use client'

import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'
import { Badge, Card } from '@/components/ui'

interface TimelineItemProps {
  year: string
  title: string
  description: string
  icon: LucideIcon
  index: number
  isEven: boolean
}

export function TimelineItem({
  year,
  title,
  description,
  icon: Icon,
  index,
  isEven,
}: TimelineItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{
        delay: index * 0.1,
        duration: 0.5,
        ease: 'easeOut',
      }}
      className={`relative flex items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}
    >
      <div className="absolute left-4 flex h-8 w-8 items-center justify-center md:left-1/2 md:-translate-x-1/2">
        <motion.div
          className="flex h-8 w-8 items-center justify-center rounded-full border-4 border-background bg-primary"
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: index * 0.1 + 0.2, type: 'spring' }}
        >
          <Icon className="h-4 w-4 text-primary-foreground" />
        </motion.div>
        <motion.div
          className="absolute h-8 w-8 rounded-full bg-primary/20"
          animate={{ scale: [1, 1.5, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: index * 0.1,
          }}
        />
      </div>

      <div className={`ml-16 w-full md:ml-0 md:w-5/12 ${isEven ? 'md:pr-12' : 'md:pl-12'}`}>
        <motion.div whileHover={{ scale: 1.02, y: -5 }} transition={{ duration: 0.2 }}>
          <Card className="relative overflow-hidden border-border/50 bg-card p-4 shadow-lg md:p-6">
            <div className="relative z-10">
              <Badge className="mb-3" variant="outline">
                {year}
              </Badge>
              <h3 className="mb-2 text-lg font-bold md:text-xl">{title}</h3>
              <p className="text-sm text-muted-foreground md:text-base">{description}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      <div className="hidden w-5/12 md:block" />
    </motion.div>
  )
}
