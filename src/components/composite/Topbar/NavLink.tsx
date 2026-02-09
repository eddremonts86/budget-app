import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import type { NavItem } from './types'

interface NavLinkProps {
  item: NavItem
  onClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void
}

export const NavLink = memo(({ item, onClick }: NavLinkProps) => {
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
})

NavLink.displayName = 'NavLink'
