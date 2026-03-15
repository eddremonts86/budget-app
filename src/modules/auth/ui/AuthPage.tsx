import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useNavigate } from '@tanstack/react-router'
import { LazyMotion, domAnimation, m } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  KeyRound,
  LayoutDashboard,
  LockKeyhole,
  LogIn,
  Orbit,
  ShieldCheck,
  Sparkles,
  UserPlus,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { authClient } from '@/shared/lib/auth/better-auth-client'
import {
  getClerkPublishableKey,
  isBetterAuthEnabled,
  isClerkEnabled,
} from '@/shared/lib/auth/config'
import { AuthField } from './components/AuthField'
import { InsightCard } from './components/InsightCard'

export function AuthPage(): React.JSX.Element {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const auth = useAppAuth()
  const [activeTab, setActiveTab] = React.useState<'sign-in' | 'sign-up'>('sign-in')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [signInValues, setSignInValues] = React.useState({
    email: '',
    password: '',
  })
  const [signUpValues, setSignUpValues] = React.useState({
    name: '',
    email: '',
    password: '',
  })
  const [isPending, startTransition] = React.useTransition()

  React.useEffect(() => {
    if (auth.isLoaded && auth.isAuthenticated) {
      void navigate({ to: '/dashboard' })
    }
  }, [auth.isAuthenticated, auth.isLoaded, navigate])

  const localAuthEnabled = isBetterAuthEnabled()
  const clerkAuthEnabled = isClerkEnabled() && !!getClerkPublishableKey()
  const heroGlowStyle: React.CSSProperties = {
    backgroundImage:
      'radial-gradient(circle at top left, rgba(14,165,233,0.18), transparent 24%), radial-gradient(circle at 80% 20%, rgba(16,185,129,0.16), transparent 28%), radial-gradient(circle at bottom right, rgba(245,158,11,0.12), transparent 30%)',
  }
  const heroGridStyle: React.CSSProperties = {
    backgroundImage:
      'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
    backgroundSize: '32px 32px',
  }

  const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    startTransition(() => {
      void (async () => {
        const { error } = await authClient.signIn.email({
          email: signInValues.email,
          password: signInValues.password,
        })

        if (error) {
          setFormError(error.message ?? t('common.unknownError'))
          return
        }

        void navigate({ to: '/dashboard' })
      })()
    })
  }

  const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFormError(null)

    startTransition(() => {
      void (async () => {
        const { error } = await authClient.signUp.email({
          name: signUpValues.name,
          email: signUpValues.email,
          password: signUpValues.password,
        })

        if (error) {
          setFormError(error.message ?? t('common.unknownError'))
          return
        }

        void navigate({ to: '/dashboard' })
      })()
    })
  }

  return (
    <LazyMotion features={domAnimation}>
      <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <div className="absolute inset-0" style={heroGlowStyle} />
        <div className="absolute inset-0 opacity-40" style={heroGridStyle} />
        <div className="absolute left-[8%] top-24 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-[12%] top-40 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col justify-center px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4" />
                {t('auth.backHome')}
              </Link>
            </Button>

            {auth.isAuthenticated && (
              <Button size="sm" asChild>
                <Link to="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  {t('auth.goDashboard')}
                </Link>
              </Button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
            <m.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="rounded-[2rem] border border-border/60 bg-card/70 p-8 shadow-2xl shadow-primary/5 backdrop-blur md:p-10"
            >
              <Badge
                variant="outline"
                className="mb-4 rounded-full border-primary/20 bg-primary/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-primary"
              >
                {t('auth.workspaceAccess')}
              </Badge>

              <div className="max-w-xl space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  {t('auth.singleEntryTitle')}
                </h1>
                <p className="text-base leading-7 text-muted-foreground sm:text-lg">
                  {t('auth.singleEntryDescription')}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <InsightCard icon={KeyRound} text={t('auth.pointOne')} />
                <InsightCard icon={Sparkles} text={t('auth.pointTwo')} />
                <InsightCard icon={ShieldCheck} text={t('auth.pointThree')} />
              </div>

              <div className="mt-8 rounded-[1.5rem] border border-border/50 bg-background/70 p-6">
                <h2 className="text-lg font-semibold">{t('auth.sideTitle')}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('auth.sideDescription')}
                </p>
              </div>
            </m.section>

            <m.section
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08, ease: 'easeOut' }}
              className="flex items-center"
            >
              <div className="grid w-full gap-5">
                <Card className="overflow-hidden rounded-[2rem] border-border/60 bg-card/90 shadow-2xl shadow-black/5 backdrop-blur">
                  <CardHeader className="space-y-3 border-b border-border/50 bg-background/50 pb-5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <LockKeyhole className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{t('auth.localPanelTitle')}</CardTitle>
                        <CardDescription>{t('auth.localPanelDescription')}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6 p-6">
                    {!localAuthEnabled && (
                      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-4 text-sm text-muted-foreground">
                        <p className="font-medium text-foreground">{t('auth.localOnly')}</p>
                        <p className="mt-1">{t('auth.localOnlyDescription')}</p>
                      </div>
                    )}

                    {localAuthEnabled && (
                      <>
                        <div className="flex items-center justify-between rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 text-sm">
                          <span className="font-medium text-foreground">
                            {t('auth.recommendedLocal')}
                          </span>
                          <span className="text-muted-foreground">{t('auth.signInHint')}</span>
                        </div>

                        <Tabs
                          value={activeTab}
                          onValueChange={(value) => setActiveTab(value as 'sign-in' | 'sign-up')}
                          className="space-y-6"
                        >
                          <TabsList className="grid w-full grid-cols-2 rounded-2xl border border-border/50 bg-muted/40 p-1">
                            <TabsTrigger
                              value="sign-in"
                              className="rounded-xl data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
                            >
                              <LogIn className="h-4 w-4" />
                              {t('auth.signInTab')}
                            </TabsTrigger>
                            <TabsTrigger
                              value="sign-up"
                              className="rounded-xl text-muted-foreground data-[state=active]:bg-background/80 data-[state=active]:text-foreground"
                            >
                              <UserPlus className="h-4 w-4" />
                              {t('auth.signUpTab')}
                            </TabsTrigger>
                          </TabsList>

                          {formError && (
                            <div className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
                              {formError}
                            </div>
                          )}

                          <TabsContent value="sign-in" className="mt-0">
                            <form className="space-y-4" onSubmit={handleSignIn}>
                              <AuthField
                                id="sign-in-email"
                                label={t('auth.emailLabel')}
                                placeholder={t('auth.emailPlaceholder')}
                                type="email"
                                value={signInValues.email}
                                onChange={(value) =>
                                  setSignInValues((current) => ({ ...current, email: value }))
                                }
                              />
                              <AuthField
                                id="sign-in-password"
                                label={t('auth.passwordLabel')}
                                placeholder={t('auth.passwordPlaceholder')}
                                type="password"
                                value={signInValues.password}
                                onChange={(value) =>
                                  setSignInValues((current) => ({ ...current, password: value }))
                                }
                              />

                              <Button
                                type="submit"
                                className="h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(255,255,255,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_22px_50px_rgba(255,255,255,0.18)]"
                                disabled={isPending}
                              >
                                <LogIn className="h-4 w-4" />
                                {isPending ? t('auth.submitting') : t('auth.signInAction')}
                              </Button>
                            </form>
                          </TabsContent>

                          <TabsContent value="sign-up" className="mt-0">
                            <form className="space-y-4" onSubmit={handleSignUp}>
                              <AuthField
                                id="sign-up-name"
                                label={t('auth.nameLabel')}
                                placeholder={t('auth.namePlaceholder')}
                                value={signUpValues.name}
                                onChange={(value) =>
                                  setSignUpValues((current) => ({ ...current, name: value }))
                                }
                              />
                              <AuthField
                                id="sign-up-email"
                                label={t('auth.emailLabel')}
                                placeholder={t('auth.emailPlaceholder')}
                                type="email"
                                value={signUpValues.email}
                                onChange={(value) =>
                                  setSignUpValues((current) => ({ ...current, email: value }))
                                }
                              />
                              <AuthField
                                id="sign-up-password"
                                label={t('auth.passwordLabel')}
                                placeholder={t('auth.passwordPlaceholder')}
                                type="password"
                                value={signUpValues.password}
                                onChange={(value) =>
                                  setSignUpValues((current) => ({ ...current, password: value }))
                                }
                              />

                              <Button
                                type="submit"
                                variant="secondary"
                                className="h-11 w-full rounded-xl border border-border/60 bg-secondary/70 text-secondary-foreground transition-colors hover:bg-secondary"
                                disabled={isPending}
                              >
                                <UserPlus className="h-4 w-4" />
                                {isPending ? t('auth.submitting') : t('auth.signUpAction')}
                              </Button>
                            </form>
                          </TabsContent>
                        </Tabs>
                      </>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-[2rem] border-border/60 bg-card/85 shadow-xl shadow-black/5 backdrop-blur">
                  <CardContent className="grid gap-5 p-6 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
                      <Orbit className="h-5 w-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{t('auth.clerkPanelTitle')}</p>
                        <Badge
                          variant="outline"
                          className="rounded-full border-border/60 bg-background/70"
                        >
                          {clerkAuthEnabled
                            ? t('auth.recommendedExternal')
                            : t('auth.clerkUnavailableLabel')}
                        </Badge>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {clerkAuthEnabled
                          ? t('auth.clerkPanelDescription')
                          : t('auth.clerkUnavailable')}
                      </p>
                    </div>

                    {clerkAuthEnabled ? (
                      <SignInButton mode="modal">
                        <Button
                          variant="outline"
                          className="h-11 rounded-xl border-border/60 bg-background/60 px-5 backdrop-blur hover:bg-background/80"
                        >
                          <ArrowRight className="h-4 w-4" />
                          {t('auth.clerkAction')}
                        </Button>
                      </SignInButton>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border/60 px-4 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {t('auth.clerkOffline')}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </m.section>
          </div>
        </div>
      </main>
    </LazyMotion>
  )
}
