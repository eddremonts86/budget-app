'use client'

import { m } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Badge, Card, Input, Button } from '@/components/ui'
import { FooterColumn } from './FooterColumn'
import { SocialLinks } from './SocialLinks'

export function FooterBlock() {
  const { t } = useTranslation()
  const footerLinks = [
    {
      title: t('home.footer.links.essence.title'),
      links: t('home.footer.links.essence.items', { returnObjects: true }) as string[],
    },
    {
      title: t('home.footer.links.company.title'),
      links: t('home.footer.links.company.items', { returnObjects: true }) as string[],
    },
    {
      title: t('home.footer.links.community.title'),
      links: t('home.footer.links.community.items', { returnObjects: true }) as string[],
    },
    {
      title: t('home.footer.links.legal.title'),
      links: t('home.footer.links.legal.items', { returnObjects: true }) as string[],
    },
  ]

  return (
    <footer className="relative w-full overflow-hidden border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-6">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="mb-4 inline-flex items-center gap-3">
              <Card className="rounded-2xl border border-border/60 bg-card/80 px-3 py-1 text-xs uppercase tracking-[0.32em] text-muted-foreground shadow-sm">
                {t('home.footer.brand')}
              </Card>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {t('home.footer.since')}
              </Badge>
            </div>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              {t('home.footer.description')}
            </p>

            <div className="mb-4">
              <p className="mb-2 text-sm font-medium text-foreground">
                {t('home.footer.subscribe.title')}
              </p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder={t('home.footer.subscribe.placeholder')}
                  className="max-w-[240px]"
                />
                <Button size="sm">{t('home.footer.subscribe.button')}</Button>
              </div>
            </div>
          </m.div>

          {footerLinks.map((section) => (
            <FooterColumn key={section.title} title={section.title} links={section.links} />
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center justify-between border-t border-border/40 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {t('home.footer.copyright', { year: new Date().getFullYear() })}
          </p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  )
}
