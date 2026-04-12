'use client'

import {
  IconBrandX,
  IconBrandFacebook,
  IconBrandInstagram,
  IconBrandLinkedin,
  IconBrandGithub,
} from '@tabler/icons-react'

const socialLinks = [
  { icon: IconBrandX, label: 'Twitter', href: '#' },
  { icon: IconBrandFacebook, label: 'Facebook', href: '#' },
  { icon: IconBrandInstagram, label: 'Instagram', href: '#' },
  { icon: IconBrandLinkedin, label: 'LinkedIn', href: '#' },
  { icon: IconBrandGithub, label: 'GitHub', href: '#' },
]

export function SocialLinks() {
  return (
    <div className="mt-4 flex gap-4 sm:mt-0">
      {socialLinks.map((social) => (
        <a
          key={social.label}
          href={social.href}
          className="text-muted-foreground transition-colors hover:text-primary"
          aria-label={social.label}
        >
          <social.icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  )
}
