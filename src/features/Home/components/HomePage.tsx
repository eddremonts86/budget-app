import { Topbar } from '@/components/composite/Topbar'
import {
  GlowyWavesHero,
  FeatureCardsBlock,
  NewHeroSection,
  OurServicesSection,
  TimelineBlock,
  ContactBlock,
  FooterBlock,
} from '@/features/Home'

export function HomePage() {
  return (
    <div className="flex flex-col min-h-screen" id="home">
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
