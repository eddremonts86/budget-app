'use client'

import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket, LogIn, Menu } from 'lucide-react'
import { memo, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Separator,
} from '@/components/ui'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import {
  getClerkPublishableKey,
  isBetterAuthEnabled,
  isClerkEnabled,
} from '@/shared/lib/auth/config'
import { LanguageSelector } from '../LanguageSelector'
import { ThemeToggle } from '../ThemeToggle'
import { TOPBAR_HEIGHT } from './constants'
import { getDashboardItem, getNavItems } from './nav-config'
import { NavLink } from './NavLink'
import type { NavItem } from './types'

export const Topbar = memo(function Topbar() {
  const { t } = useTranslation()
  const auth = useAppAuth()
  const [isOpen, setIsOpen] = useState(false)
  const hasClerkRuntime = isClerkEnabled() && !!getClerkPublishableKey()
  const hasBetterAuthRuntime = isBetterAuthEnabled()
  const hasUnifiedAuthEntry = hasBetterAuthRuntime || hasClerkRuntime

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
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/70 backdrop-blur-sm shadow-sm">
      <div className="container mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link
            to="/"
            className="flex items-center gap-2"
            onClick={(e) =>
              handleScroll(e as unknown as React.MouseEvent<HTMLAnchorElement>, 'home')
            }
          >
            <motion.div
              whileHover={{ rotate: 20, scale: 1.1 }}
              className="p-1.5 rounded-lg bg-primary/15 text-primary"
            >
              <Rocket className="w-6 h-6" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">
              {t('app.brand')}
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-5">
            {navItems.map((item) => (
              <NavLink key={item.id} item={item} onClick={handleScroll} />
            ))}
            {auth.isAuthenticated && <NavLink item={dashboardItem} onClick={handleScroll} />}
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
                    {auth.isAuthenticated && (
                      <NavLink
                        item={dashboardItem}
                        onClick={handleScroll}
                        className="text-lg w-full justify-start px-4 py-3 h-auto hover:bg-secondary rounded-lg transition-colors"
                      />
                    )}
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

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-3">
            <LanguageSelector />
            <ThemeToggle />
          </div>

          {!auth.isAuthenticated && hasUnifiedAuthEntry && (
            <Button variant="ghost" size="sm" className="gap-2" asChild>
              <Link to="/auth">
                <LogIn className="h-4 w-4" />
                {t('auth.topbarCta', 'Access workspace')}
              </Link>
            </Button>
          )}

          {auth.isAuthenticated && auth.user && (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-3 px-2" asChild>
                <Link to="/dashboard">
                  <Avatar className="h-8 w-8 border border-border/60">
                    <AvatarImage src={auth.user.image ?? undefined} alt={auth.user.name} />
                    <AvatarFallback>{auth.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline max-w-32 truncate">{auth.user.name}</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2"
                onClick={() => void auth.signOut()}
              >
                {t('nav.signOut', 'Sign out')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
})
