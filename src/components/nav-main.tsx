import { type Icon } from '@tabler/icons-react'
import { Link, useLocation } from '@tanstack/react-router'
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

export function NavMain({
  sections,
}: {
  sections: {
    title: string
    items: {
      title: string
      url?: string
      icon?: Icon
      onClick?: () => void
      badge?: React.ReactNode
    }[]
  }[]
}) {
  const location = useLocation()
  const pathname = location.pathname

  return (
    <>
      {sections.map((section) => (
        <SidebarGroup key={section.title}>
          <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {section.items.map((item) => {
                const isActive = item.url
                  ? item.url === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.url)
                  : false
                return (
                  <SidebarMenuItem key={item.title}>
                    {item.url ? (
                      <SidebarMenuButton asChild tooltip={item.title} isActive={isActive}>
                        <Link to={item.url}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.badge && <div className="ml-auto">{item.badge}</div>}
                        </Link>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton tooltip={item.title} onClick={item.onClick}>
                        {item.icon && <item.icon />}
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  )
}
