import { SignInButton } from '@clerk/tanstack-react-start'
import { Link, useLocation } from '@tanstack/react-router'
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
} from '@/components/ui'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import {
  getClerkPublishableKey,
  isBetterAuthEnabled,
  isClerkEnabled,
} from '@/shared/lib/auth/config'
import {
  AUTH_SIGN_UP_NAME_HTML_PATTERN,
  AUTH_SIGN_UP_PASSWORD_HTML_PATTERN,
  AUTH_SIGN_UP_MIN_PASSWORD_LENGTH,
  type SignUpValidationErrorCode,
} from '@/shared/lib/auth/sign-up-validation'
import { AuthField } from './components/AuthField'
import { InsightCard } from './components/InsightCard'

type AuthTab = 'sign-in' | 'sign-up'

function readSearchParams(searchStr: string) {
  const normalizedSearch = searchStr.startsWith('?') ? searchStr.slice(1) : searchStr
  return new URLSearchParams(normalizedSearch)
}

function getRequestedAuthTab(searchStr: string): AuthTab | null {
  const requestedTab = readSearchParams(searchStr).get('tab')

  if (requestedTab === 'sign-in' || requestedTab === 'sign-up') {
    return requestedTab
  }

  return null
}

function getRequestedAuthError(
  searchStr: string,
  translate: (key: string) => string,
): string | null {
  const searchParams = readSearchParams(searchStr)
  const errorCode = searchParams.get('errorCode')
  const errorMessage = searchParams.get('errorMessage')

  if (errorCode === 'AUTH_NAME_REQUIRED' || errorCode === 'AUTH_PASSWORD_TOO_WEAK') {
    return getLocalizedSignUpValidationMessage(errorCode, translate)
  }

  if (typeof errorMessage === 'string' && errorMessage.length > 0) {
    return errorMessage
  }

  return null
}

function getLocalizedSignUpValidationMessage(
  code: SignUpValidationErrorCode,
  translate: (key: string) => string,
): string {
  switch (code) {
    case 'AUTH_NAME_REQUIRED':
      return translate('auth.nameRequiredError')
    case 'AUTH_PASSWORD_TOO_WEAK':
      return translate('auth.passwordWeakError').replace(
        '{{min}}',
        String(AUTH_SIGN_UP_MIN_PASSWORD_LENGTH),
      )
  }
}

export function AuthPage(): React.JSX.Element {
  const { t } = useTranslation()
  const searchStr = useLocation({ select: (location) => location.searchStr })
  const auth = useAppAuth()
  const activeTab = getRequestedAuthTab(searchStr) ?? 'sign-in'
  const requestedFormError = getRequestedAuthError(searchStr, t)
  const [signInValues, setSignInValues] = React.useState({
    email: '',
    password: '',
  })
  const [signUpValues, setSignUpValues] = React.useState({
    name: '',
    email: '',
    password: '',
  })
  const formError = requestedFormError

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

                        <div className="space-y-6">
                          <div
                            role="tablist"
                            aria-label={t('auth.localPanelTitle')}
                            className="grid w-full grid-cols-2 rounded-2xl border border-border/50 bg-muted/40 p-1"
                          >
                            <a
                              href="/auth"
                              role="tab"
                              id="auth-tab-sign-in"
                              aria-controls="auth-panel-sign-in"
                              aria-selected={activeTab === 'sign-in'}
                              data-state={activeTab === 'sign-in' ? 'active' : 'inactive'}
                              data-testid="auth-tab-sign-in"
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium text-foreground/60 transition-all hover:text-foreground data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-[0_10px_30px_rgba(255,255,255,0.08)]"
                            >
                              <LogIn className="h-4 w-4" />
                              {t('auth.signInTab')}
                            </a>
                            <a
                              href="/auth?tab=sign-up"
                              role="tab"
                              id="auth-tab-sign-up"
                              aria-controls="auth-panel-sign-up"
                              aria-selected={activeTab === 'sign-up'}
                              data-state={activeTab === 'sign-up' ? 'active' : 'inactive'}
                              data-testid="auth-tab-sign-up"
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-transparent px-2 py-1 text-sm font-medium text-muted-foreground transition-all hover:text-foreground data-[state=active]:bg-background/80 data-[state=active]:text-foreground"
                            >
                              <UserPlus className="h-4 w-4" />
                              {t('auth.signUpTab')}
                            </a>
                          </div>

                          {formError && (
                            <div
                              data-testid="auth-form-error"
                              className="rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                            >
                              {formError}
                            </div>
                          )}

                          {activeTab === 'sign-in' ? (
                            <div
                              role="tabpanel"
                              id="auth-panel-sign-in"
                              aria-labelledby="auth-tab-sign-in"
                            >
                              <form className="space-y-4" action="/auth/sign-in" method="post">
                                <AuthField
                                  autoComplete="email"
                                  id="sign-in-email"
                                  label={t('auth.emailLabel')}
                                  name="email"
                                  placeholder={t('auth.emailPlaceholder')}
                                  testId="auth-input-sign-in-email"
                                  type="email"
                                  value={signInValues.email}
                                  onChange={(value) =>
                                    setSignInValues((current) => ({ ...current, email: value }))
                                  }
                                />
                                <AuthField
                                  autoComplete="current-password"
                                  id="sign-in-password"
                                  label={t('auth.passwordLabel')}
                                  name="password"
                                  placeholder={t('auth.passwordPlaceholder')}
                                  testId="auth-input-sign-in-password"
                                  type="password"
                                  value={signInValues.password}
                                  onChange={(value) =>
                                    setSignInValues((current) => ({ ...current, password: value }))
                                  }
                                />

                                <Button
                                  type="submit"
                                  data-testid="auth-submit-sign-in"
                                  className="h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-[0_18px_40px_rgba(255,255,255,0.14)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/95 hover:shadow-[0_22px_50px_rgba(255,255,255,0.18)]"
                                >
                                  <LogIn className="h-4 w-4" />
                                  {t('auth.signInAction')}
                                </Button>
                              </form>
                            </div>
                          ) : null}

                          {activeTab === 'sign-up' ? (
                            <div
                              role="tabpanel"
                              id="auth-panel-sign-up"
                              aria-labelledby="auth-tab-sign-up"
                            >
                              <form className="space-y-4" action="/auth/sign-up" method="post">
                                <AuthField
                                  autoComplete="name"
                                  id="sign-up-name"
                                  label={t('auth.nameLabel')}
                                  name="name"
                                  pattern={AUTH_SIGN_UP_NAME_HTML_PATTERN}
                                  placeholder={t('auth.namePlaceholder')}
                                  testId="auth-input-sign-up-name"
                                  value={signUpValues.name}
                                  onChange={(value) =>
                                    setSignUpValues((current) => ({ ...current, name: value }))
                                  }
                                />
                                <AuthField
                                  autoComplete="email"
                                  id="sign-up-email"
                                  label={t('auth.emailLabel')}
                                  name="email"
                                  placeholder={t('auth.emailPlaceholder')}
                                  testId="auth-input-sign-up-email"
                                  type="email"
                                  value={signUpValues.email}
                                  onChange={(value) =>
                                    setSignUpValues((current) => ({ ...current, email: value }))
                                  }
                                />
                                <AuthField
                                  autoComplete="new-password"
                                  id="sign-up-password"
                                  label={t('auth.passwordLabel')}
                                  minLength={AUTH_SIGN_UP_MIN_PASSWORD_LENGTH}
                                  name="password"
                                  pattern={AUTH_SIGN_UP_PASSWORD_HTML_PATTERN}
                                  placeholder={t('auth.passwordPlaceholder')}
                                  testId="auth-input-sign-up-password"
                                  type="password"
                                  value={signUpValues.password}
                                  onChange={(value) =>
                                    setSignUpValues((current) => ({ ...current, password: value }))
                                  }
                                />
                                <p className="text-sm text-muted-foreground">
                                  {t('auth.passwordRequirementHint').replace(
                                    '{{min}}',
                                    String(AUTH_SIGN_UP_MIN_PASSWORD_LENGTH),
                                  )}
                                </p>

                                <Button
                                  type="submit"
                                  variant="secondary"
                                  data-testid="auth-submit-sign-up"
                                  className="h-11 w-full rounded-xl border border-border/60 bg-secondary/70 text-secondary-foreground transition-colors hover:bg-secondary"
                                >
                                  <UserPlus className="h-4 w-4" />
                                  {t('auth.signUpAction')}
                                </Button>
                              </form>
                            </div>
                          ) : null}
                        </div>
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
                      <SignInButton mode="modal" forceRedirectUrl="/dashboard">
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
