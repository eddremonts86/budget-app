'use client'

import { Twitter, Facebook, Instagram, Linkedin, Github } from 'lucide-react'

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
]

export function SocialLinks() {
  return (
    <div className="mt-4 flex gap-4 sm:mt-0">
      {socialLinks.map((social, index) => (
        <a
          key={index}
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
