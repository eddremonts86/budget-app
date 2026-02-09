import type { TFunction } from 'i18next'
import type { NavItem } from './types'

export const getNavItems = (t: TFunction): NavItem[] => [
  { id: 'home', label: t('nav.home'), to: '/' },
  { id: 'services', label: t('nav.services'), href: '#services' },
  { id: 'timeline', label: t('nav.timeline'), href: '#timeline' },
  { id: 'contact', label: t('nav.contact'), href: '#contact' },
]

export const getDashboardItem = (): NavItem => ({
  id: 'dashboard',
  label: 'Dashboard',
  to: '/dashboard',
})
