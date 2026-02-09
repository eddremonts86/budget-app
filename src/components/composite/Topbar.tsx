'use client'

import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/tanstack-react-start'
import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import { Rocket, LogIn } from 'lucide-react'
import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'
import { LanguageSelector } from './LanguageSelector'
import { ThemeToggle } from './ThemeToggle'

interface NavItem {
  id: string
  label: string
  href?: string
  to?: string
}

const NavLink = memo(
  ({
    item,
    onClick,
  }: {
    item: NavItem
    onClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void
  }) => {
    if (item.to) {
      return (
        <Link
          to={item.to as '/'}
          className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
          onClick={(e) => onClick(e as unknown as React.MouseEvent<HTMLAnchorElement>, item.id)}
        >
          {item.label}
        </Link>
      )
    }

    return (
      <a
        href={item.href}
        className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
        onClick={(e) => onClick(e, item.id)}
      >
        {item.label}
      </a>
    )
  },
)

NavLink.displayName = 'NavLink'

export const Topbar = memo(function Topbar() {
  const { t } = useTranslation()

  const handleScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
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
  }, [])

  const navItems = useMemo<NavItem[]>(
    () => [
      { id: 'home', label: t('nav.home'), to: '/' },
      { id: 'services', label: t('nav.services'), href: '#services' },
      { id: 'timeline', label: t('nav.timeline'), href: '#timeline' },
      { id: 'contact', label: t('nav.contact'), href: '#contact' },
    ],
    [t],
  )

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
