import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Home, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center  p-4 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-muted/30">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 260,
              damping: 20,
              repeat: Infinity,
              repeatType: 'reverse',
              duration: 2
            }}
          >
            <AlertCircle className="h-16 w-16 text-destructive/80" />
          </motion.div>
        </div>

        <div className="space-y-2">
          <motion.h1
            className="text-7xl font-bold tracking-tighter text-foreground"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            404
          </motion.h1>
          <motion.h2
            className="text-2xl font-semibold text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Page not found
          </motion.h2>
          <motion.p
            className="mx-auto max-w-[500px] text-muted-foreground/80"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Sorry, we couldn't find the page you're looking for. It might have been removed, renamed, or doesn't exist.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button asChild size="lg" className="group">
            <Link to="/">
              <Home className="mr-2 h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Back to Home
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
