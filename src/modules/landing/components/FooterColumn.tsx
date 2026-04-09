'use client'

interface FooterColumnProps {
  title: string
  links: string[]
}

export function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="lg:col-span-1">
      <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
        {title}
      </h3>
      <ul className="space-y-2">
        {links.map((link, linkIndex) => (
          <li key={linkIndex}>
            <button
              type="button"
              className="text-sm text-muted-foreground transition-colors hover:text-primary"
            >
              {link}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
