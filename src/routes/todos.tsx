import { createFileRoute, Link } from '@tanstack/react-router'
import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TodoForm, TodoList } from '@/features/ToDo'
import { LanguageSelector, ThemeToggle } from '@/shared/components/ui'
import { cn } from '@/shared/lib/utils'

export const Route = createFileRoute('/todos')({
  component: TodosPage,
})

function TodosPage() {
  const { t } = useTranslation()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b flex-none">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="flex items-center gap-2">
              <img src="/tanstack-circle-logo.png" className="h-8 w-8" alt="TanStack Logo" />
              <span className="font-bold text-xl">{t('app.name')}</span>
            </Link>
          </div>
          <nav className="flex items-center gap-4">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              {t('nav.home')}
            </Link>
            <Link to="/todos" className="text-sm font-medium text-primary">
              {t('nav.todos')}
            </Link>
            <div className="flex items-center gap-2 ml-4">
              <LanguageSelector />
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <div className="container mx-auto px-4 py-8 h-full flex flex-col">
          <div className="w-full h-full flex flex-col">
            {/* Page Header */}
            <div className="flex-none flex items-center justify-between mb-8">
              <h1 className="text-3xl font-bold">{t('todo.title')}</h1>
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  showForm
                    ? 'bg-secondary hover:bg-secondary/80'
                    : 'bg-primary text-primary-foreground hover:bg-primary/90',
                )}
              >
                {showForm ? (
                  <>
                    <X className="h-4 w-4" />
                    {t('common.cancel')}
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    {t('todo.createNew')}
                  </>
                )}
              </button>
            </div>

            {/* Create Form */}
            {showForm && (
              <div className="flex-none mb-8 p-6 rounded-lg border bg-card animate-in fade-in slide-in-from-top-2 duration-300">
                <h2 className="text-lg font-medium mb-4">{t('todo.createNew')}</h2>
                <TodoForm onSuccess={() => setShowForm(false)} />
              </div>
            )}

            {/* Todo List */}
            <div className="flex-1 min-h-0">
              <TodoList />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
