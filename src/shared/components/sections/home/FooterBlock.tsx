'use client'

import { motion } from 'framer-motion'
import { Twitter, Facebook, Instagram, Linkedin, Github } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Badge, Card, Input, Button } from '@/shared/components/ui'

const footerLinks = [
  {
    title: 'Product',
    links: ['Features', 'Pricing', 'Documentation', 'API Reference'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Careers', 'Blog', 'Press Kit'],
  },
  {
    title: 'Resources',
    links: ['Community', 'Help Center', 'Partners', 'Status'],
  },
  {
    title: 'Legal',
    links: ['Privacy', 'Terms', 'Cookie Policy', 'Licenses'],
  },
]

const socialLinks = [
  { icon: Twitter, label: 'Twitter', href: '#' },
  { icon: Facebook, label: 'Facebook', href: '#' },
  { icon: Instagram, label: 'Instagram', href: '#' },
  { icon: Linkedin, label: 'LinkedIn', href: '#' },
  { icon: Github, label: 'GitHub', href: '#' },
]

export function FooterBlock() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="mb-4 inline-flex items-center gap-3">
              <Card className="rounded-2xl border border-border/60 bg-card/80 px-3 py-1 text-xs uppercase tracking-[0.32em] text-muted-foreground shadow-sm">
                Brand
              </Card>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Since 2018
              </Badge>
            </div>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              Building amazing products with modern technologies. Join us on our journey to create
              better user experiences.
            </p>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-foreground">
                Subscribe to our newsletter
              </p>
              <div className="flex gap-2">
                <Input type="email" placeholder="Enter your email" className="max-w-[240px]" />
                <Button size="sm">Subscribe</Button>
              </div>
            </div>
          </motion.div>

          {footerLinks.map((section, index) => (
            <div key={index} className="lg:col-span-1">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">© 2024 Brand Inc. All rights reserved.</p>
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
        </div>
      </div>
    </footer>
  )
}
