'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket, LogIn } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LanguageSelector } from '../LanguageSelector'
import { ThemeToggle } from '../ThemeToggle'
import { TOPBAR_HEIGHT } from './constants'
import { getDashboardItem, getNavItems } from './nav-config'
import { NavLink } from './NavLink'
import type { NavItem } from './types'

export const Topbar = memo(function Topbar() {
  const { t } = useTranslation()

  const handleScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const element = document.getElementById(id)
    if (element) {
      e.preventDefault()
      const elementPosition = element.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - TOPBAR_HEIGHT

      window.scrollTo({
        top: id === 'home' ? 0 : offsetPosition,
        behavior: 'smooth',
      })
    }
  }, [])

  const navItems = useMemo<NavItem[]>(() => getNavItems(t), [t])

  const dashboardItem = useMemo<NavItem>(() => getDashboardItem(), [])

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
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} onClick={handleScroll} />
            ))}
            <SignedIn>
              <NavLink item={dashboardItem} onClick={handleScroll} />
            </SignedIn>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <LanguageSelector />
          <ThemeToggle />

          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="gap-2">
                <LogIn className="h-4 w-4" />
                {t('nav.signIn')}
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-2">
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'h-8 w-8',
                  },
                }}
              />
            </div>
          </SignedIn>
        </div>
      </div>
    </header>
  )
})
