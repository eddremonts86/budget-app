import { createFileRoute, Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { t } = useTranslation()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/tanstack-circle-logo.png" className="h-8 w-8" alt="TanStack Logo" />
            <span className="font-bold text-xl">{t('app.name')}</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/todos" className="text-sm font-medium hover:text-primary transition-colors">
              {t('nav.todos')}
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {t('app.name')}
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
            {t('app.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
            <Link
              to="/todos"
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {t('nav.todos')}
            </Link>
            <a
              href="https://tanstack.com/start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-md border px-6 py-3 text-sm font-medium hover:bg-secondary transition-colors"
            >
              Documentation
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-secondary/30">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold text-center mb-12">Stack Included</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={feature.name}
                className="p-4 rounded-lg border bg-card text-card-foreground animate-in fade-in slide-in-from-bottom-2"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="text-2xl mb-2">{feature.icon}</div>
                <h3 className="font-medium">{feature.name}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>
            Built with{' '}
            <a
              href="https://tanstack.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              TanStack
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  { icon: '⚡', name: 'TanStack Start', description: 'Full-stack React framework' },
  { icon: '🔄', name: 'TanStack Query', description: 'Powerful data synchronization' },
  { icon: '📝', name: 'TanStack Form', description: 'Performant form management' },
  { icon: '📊', name: 'TanStack Table', description: 'Headless table utilities' },
  { icon: '🎨', name: 'Tailwind CSS', description: 'Utility-first styling' },
  { icon: '🌙', name: 'Dark Mode', description: 'Light/dark theme support' },
  { icon: '🌍', name: 'i18n', description: 'Multi-language support' },
  { icon: '🔐', name: 'Clerk Auth', description: 'Authentication ready' },
]
