'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket, LogIn, Menu } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from '@/components/ui'
import { LanguageSelector } from '../LanguageSelector'
import { ThemeToggle } from '../ThemeToggle'
import { TOPBAR_HEIGHT } from './constants'
import { getDashboardItem, getNavItems } from './nav-config'
import { NavLink } from './NavLink'
import type { NavItem } from './types'

export const Topbar = memo(function Topbar() {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const handleScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    setIsOpen(false)
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

          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">{t('common.openMenu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px] flex flex-col px-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="px-6 py-6">
                    <SheetTitle className="flex items-center gap-2">
                      <Rocket className="w-6 h-6 text-primary" />
                      <span>{t('app.brand')}</span>
                    </SheetTitle>
                  </SheetHeader>
                  <Separator />
                  <div className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.id}
                        item={item}
                        onClick={handleScroll}
                        className="text-lg w-full justify-start px-4 py-3 h-auto hover:bg-secondary rounded-lg transition-colors"
                      />
                    ))}
                    <SignedIn>
                      <NavLink
                        item={dashboardItem}
                        onClick={handleScroll}
                        className="text-lg w-full justify-start px-4 py-3 h-auto hover:bg-secondary rounded-lg transition-colors"
                      />
                    </SignedIn>
                  </div>

                  <div className="mt-auto border-t p-6 flex flex-col gap-4 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('language.title', 'Language')}
                      </span>
                      <LanguageSelector side="top" align="right" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        {t('theme.title', 'Theme')}
                      </span>
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4">
            <LanguageSelector />
            <ThemeToggle />
          </div>

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
