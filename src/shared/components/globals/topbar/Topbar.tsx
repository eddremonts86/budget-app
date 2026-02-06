'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSelector } from './LanguageSelector'
import { ThemeToggle } from './ThemeToggle'

export function Topbar() {
  const { t } = useTranslation()

  const handleScroll = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    const element = document.getElementById(id)
    if (element) {
      const topbarHeight = 64 // h-16 = 4rem = 64px
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - topbarHeight

      window.scrollTo({
        top: id === 'home' ? 0 : offsetPosition,
        behavior: 'smooth',
      })
    }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={(e) =>
              handleScroll(e as unknown as React.MouseEvent<HTMLAnchorElement>, 'home')
            }
          >
            <motion.div
              whileHover={{ rotate: 20, scale: 1.1 }}
              className="p-1.5 rounded-lg bg-primary/10 text-primary"
            >
              <Rocket className="w-6 h-6" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {t('app.brand')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) =>
                handleScroll(e as unknown as React.MouseEvent<HTMLAnchorElement>, 'home')
              }
            >
              {t('nav.home')}
            </Link>
            <a
              href="#services"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => handleScroll(e, 'services')}
            >
              {t('nav.services')}
            </a>
            <a
              href="#timeline"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => handleScroll(e, 'timeline')}
            >
              {t('nav.timeline')}
            </a>
            <a
              href="#contact"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              onClick={(e) => handleScroll(e, 'contact')}
            >
              {t('nav.contact')}
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
