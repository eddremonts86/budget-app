'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { LanguageSelector } from './LanguageSelector'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: 20, scale: 1.1 }}
              className="p-1.5 rounded-lg bg-primary/10 text-primary"
            >
              <Rocket className="w-6 h-6" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              AI Solutions
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <a
              href="#services"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Services
            </a>
            <a
              href="#timeline"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Process
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Contact
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
