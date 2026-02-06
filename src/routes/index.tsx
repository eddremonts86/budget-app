import { createFileRoute } from '@tanstack/react-router'
import { Topbar } from '@/shared/components/globals/topbar'
import {
  GlowyWavesHero,
  FeatureCardsBlock,
  NewHeroSection,
  OurServicesSection,
  TimelineBlock,
  ContactBlock,
  FooterBlock,
} from '@/shared/components/sections/home'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Topbar />
      <main className="flex-grow pt-16">
        <GlowyWavesHero />
        <FeatureCardsBlock />
        <NewHeroSection />
        <div id="services">
          <OurServicesSection />
        </div>
        <div id="timeline">
          <TimelineBlock />
        </div>
        <div id="contact">
          <ContactBlock />
        </div>
      </main>
      <FooterBlock />
    </div>
  )
}
