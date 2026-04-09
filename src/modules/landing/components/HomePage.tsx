import {
  GlowyWavesHero,
  FeatureCardsBlock,
  NewHeroSection,
  OurServicesSection,
  TimelineBlock,
  ContactBlock,
} from '@/modules/landing'

export function HomePage() {
  return (
    <div id="home">
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
    </div>
  )
}
