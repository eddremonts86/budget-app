import {
  IconLoader2,
  IconRefresh,
  IconWorldCheck,
  IconDeviceFloppy,
  IconSettings,
  IconPlugConnected,
  IconAdjustments,
} from '@tabler/icons-react'
import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  useAiConfig,
  useAiConfigStore,
  useUpdateAiConfig,
  useResetAiConfig,
  useTestAiConnection,
} from '../api/ai-config.queries'
import { type AiConfigFormData, type AiProvider } from '../model/ai-config.schema'

const PROVIDER_DEFAULTS: Record<AiProvider, Partial<AiConfigFormData>> = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    port: 443,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
    },
    parameters: {
      model: 'gpt-4o',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    port: 443,
    endpoints: {
      chat: '/messages',
      models: '/models',
    },
    parameters: {
      model: 'claude-3-5-sonnet-20240620',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
  'lm-studio': {
    baseUrl: 'http://localhost:1234/v1',
    port: 1234,
    endpoints: {
      chat: '/chat/completions',
      models: '/models',
      load: '/models/load',
      download: '/models/download',
      status: '/models/download/status/:job_id',
    },
    parameters: {
      model: 'local-model',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    },
  },
}

export function AiConfigForm() {
  const { t } = useTranslation()
  const { data: config, isLoading: isConfigLoading } = useAiConfig()
  const { data: configStore } = useAiConfigStore()
  const updateMutation = useUpdateAiConfig()
  const resetMutation = useResetAiConfig()
  const testMutation = useTestAiConnection()

  const defaultValues: AiConfigFormData = React.useMemo(() => {
    return {
      provider: config?.provider ?? 'lm-studio',
      baseUrl: config?.baseUrl ?? PROVIDER_DEFAULTS['lm-studio'].baseUrl!,
      port: config?.port ?? PROVIDER_DEFAULTS['lm-studio'].port!,
      token: config?.token ?? '',
      apiKey: config?.apiKey ?? '',
      parameters: {
        model: config?.parameters?.model ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.model,
        temperature:
          config?.parameters?.temperature ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.temperature,
        max_tokens:
          config?.parameters?.max_tokens ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.max_tokens,
        top_p: config?.parameters?.top_p ?? PROVIDER_DEFAULTS['lm-studio'].parameters!.top_p,
        frequency_penalty:
          config?.parameters?.frequency_penalty ??
          PROVIDER_DEFAULTS['lm-studio'].parameters!.frequency_penalty,
        presence_penalty:
          config?.parameters?.presence_penalty ??
          PROVIDER_DEFAULTS['lm-studio'].parameters!.presence_penalty,
      },
      endpoints: {
        chat: config?.endpoints?.chat ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.chat,
        models: config?.endpoints?.models ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.models,
        load: config?.endpoints?.load ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.load,
        download: config?.endpoints?.download ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.download,
        status: config?.endpoints?.status ?? PROVIDER_DEFAULTS['lm-studio'].endpoints!.status,
      },
      timeout: config?.timeout ?? 30000,
      additionalParams: config?.additionalParams ?? '',
    }
  }, [config])

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      try {
        await updateMutation.mutateAsync(value)
      } catch {
        // Error handled by mutation and toast
      }
    },
  })

  // Reset form when config data arrives
  React.useEffect(() => {
    if (config) {
      form.reset(defaultValues)
    }
  }, [config, defaultValues, form])

  const handleReset = async () => {
    if (confirm(t('settings.ai.actions.confirmReset'))) {
      try {
        await resetMutation.mutateAsync()
        form.reset(defaultValues)
      } catch {
        // Error handled by mutation and toast
      }
    }
  }

  const handleTestConnection = async () => {
    const value = form.state.values
    try {
      const success = await testMutation.mutateAsync(value)
      if (success) {
        toast.success(t('settings.ai.messages.testSuccess'))
      } else {
        toast.error(t('settings.ai.messages.testError'))
      }
    } catch {
      toast.error(t('settings.ai.messages.testError'))
    }
  }

  const handleProviderChange = (provider: AiProvider) => {
    const defaults = PROVIDER_DEFAULTS[provider]
    const saved = configStore?.providers?.[provider]
    const nextConfig = {
      provider,
      baseUrl: saved?.baseUrl ?? defaults.baseUrl!,
      port: saved?.port ?? defaults.port!,
      token: saved?.token ?? '',
      apiKey: saved?.apiKey ?? '',
      endpoints: {
        chat: saved?.endpoints?.chat ?? defaults.endpoints!.chat,
        models: saved?.endpoints?.models ?? defaults.endpoints!.models,
        load: saved?.endpoints?.load ?? defaults.endpoints?.load ?? '',
        download: saved?.endpoints?.download ?? defaults.endpoints?.download ?? '',
        status: saved?.endpoints?.status ?? defaults.endpoints?.status ?? '',
      },
      parameters: {
        model: saved?.parameters?.model ?? defaults.parameters!.model,
        temperature: saved?.parameters?.temperature ?? defaults.parameters!.temperature,
        max_tokens: saved?.parameters?.max_tokens ?? defaults.parameters!.max_tokens,
        top_p: saved?.parameters?.top_p ?? defaults.parameters!.top_p,
        frequency_penalty:
          saved?.parameters?.frequency_penalty ?? defaults.parameters!.frequency_penalty,
        presence_penalty:
          saved?.parameters?.presence_penalty ?? defaults.parameters!.presence_penalty,
      },
      timeout: saved?.timeout ?? 30000,
      additionalParams: saved?.additionalParams ?? '',
    }

    form.setFieldValue('provider', nextConfig.provider)
    form.setFieldValue('baseUrl', nextConfig.baseUrl)
    form.setFieldValue('port', nextConfig.port)
    form.setFieldValue('token', nextConfig.token)
    form.setFieldValue('apiKey', nextConfig.apiKey)
    form.setFieldValue('endpoints.chat', nextConfig.endpoints.chat)
    form.setFieldValue('endpoints.models', nextConfig.endpoints.models)
    form.setFieldValue('endpoints.load', nextConfig.endpoints.load)
    form.setFieldValue('endpoints.download', nextConfig.endpoints.download)
    form.setFieldValue('endpoints.status', nextConfig.endpoints.status)
    form.setFieldValue('parameters.model', nextConfig.parameters.model)
    form.setFieldValue('parameters.temperature', nextConfig.parameters.temperature)
    form.setFieldValue('parameters.max_tokens', nextConfig.parameters.max_tokens)
    form.setFieldValue('parameters.top_p', nextConfig.parameters.top_p)
    form.setFieldValue('parameters.frequency_penalty', nextConfig.parameters.frequency_penalty)
    form.setFieldValue('parameters.presence_penalty', nextConfig.parameters.presence_penalty)
    form.setFieldValue('timeout', nextConfig.timeout)
    form.setFieldValue('additionalParams', nextConfig.additionalParams)
  }

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Provider & Connection */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <div className="flex items-center gap-2">
                <IconSettings className="size-5 text-primary" />
                <h3 className="text-xl font-semibold leading-none tracking-tight">
                  {t('settings.ai.fields.provider')}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">{t('settings.ai.description')}</p>
            </div>
            <div className="p-6 pt-0 space-y-6">
              <form.Field
                name="provider"
                children={(field) => (
                  <Field>
                    <FieldLabel>{t('settings.ai.fields.provider')}</FieldLabel>
                    <Select value={field.state.value} onValueChange={handleProviderChange}>
                      <SelectTrigger className="w-full sm:max-w-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">{t('settings.ai.providers.openai')}</SelectItem>
                        <SelectItem value="anthropic">
                          {t('settings.ai.providers.anthropic')}
                        </SelectItem>
                        <SelectItem value="lm-studio">
                          {t('settings.ai.providers.lm-studio')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                )}
              />

              <Separator className="opacity-50" />

              <div className="space-y-4">
                <div className="flex items-center gap-2 font-medium text-sm text-muted-foreground uppercase tracking-wider">
                  <IconPlugConnected className="size-4" />
                  {t('settings.ai.sections.connection')}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <form.Field
                    name="baseUrl"
                    children={(field) => (
                      <Field className="sm:col-span-3">
                        <FieldLabel htmlFor={field.name}>
                          {t('settings.ai.fields.baseUrl')}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          className="bg-muted/20"
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  />

                  <form.Field
                    name="port"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.port')}</FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          className="bg-muted/20"
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  />

                  <form.Field
                    name="timeout"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>
                          {t('settings.ai.fields.timeout')}
                        </FieldLabel>
                        <Input
                          id={field.name}
                          type="number"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(Number(e.target.value))}
                          className="bg-muted/20"
                        />
                        <FieldError
                          errors={field.state.meta.errors.map((e) =>
                            typeof e === 'string' ? e : String(e),
                          )}
                        />
                      </Field>
                    )}
                  />

                  <form.Subscribe selector={(state) => state.values.provider}>
                    {(provider) =>
                      provider === 'lm-studio' ? null : (
                        <form.Field
                          name="token"
                          children={(field) => {
                            const tokenPlaceholder =
                              {
                                openai: 'sk-proj-...',
                                anthropic: 'sk-ant-...',
                              }[provider] ?? 'token-...'

                            return (
                              <Field className="sm:col-span-4">
                                <FieldLabel htmlFor={field.name}>
                                  {['openai', 'anthropic'].includes(provider)
                                    ? t('settings.ai.fields.apiKey')
                                    : t('settings.ai.fields.token')}
                                </FieldLabel>
                                <Input
                                  id={field.name}
                                  type="password"
                                  value={field.state.value}
                                  onBlur={field.handleBlur}
                                  onChange={(e) => field.handleChange(e.target.value)}
                                  placeholder={tokenPlaceholder}
                                  className="bg-muted/20"
                                />
                                <FieldError
                                  errors={field.state.meta.errors.map((e) =>
                                    typeof e === 'string' ? e : String(e),
                                  )}
                                />
                              </Field>
                            )
                          }}
                        />
                      )
                    }
                  </form.Subscribe>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <div className="flex items-center gap-2">
                <IconPlugConnected className="size-5 text-primary" />
                <h3 className="text-xl font-semibold leading-none tracking-tight">
                  {t('settings.ai.sections.endpoints')}
                </h3>
              </div>
            </div>
            <div className="p-6 pt-0">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field
                  name="endpoints.chat"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('settings.ai.fields.chatEndpoint')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />

                <form.Field
                  name="endpoints.models"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('settings.ai.fields.modelsEndpoint')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />

                <form.Subscribe selector={(state) => state.values.provider}>
                  {(provider) =>
                    provider === 'lm-studio' ? (
                      <>
                        <form.Field
                          name="endpoints.load"
                          children={(field) => (
                            <Field>
                              <FieldLabel htmlFor={field.name}>
                                {t('settings.ai.fields.loadEndpoint')}
                              </FieldLabel>
                              <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="bg-muted/20"
                              />
                              <FieldError
                                errors={field.state.meta.errors.map((e) =>
                                  typeof e === 'string' ? e : String(e),
                                )}
                              />
                            </Field>
                          )}
                        />
                        <form.Field
                          name="endpoints.download"
                          children={(field) => (
                            <Field>
                              <FieldLabel htmlFor={field.name}>
                                {t('settings.ai.fields.downloadEndpoint')}
                              </FieldLabel>
                              <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="bg-muted/20"
                              />
                              <FieldError
                                errors={field.state.meta.errors.map((e) =>
                                  typeof e === 'string' ? e : String(e),
                                )}
                              />
                            </Field>
                          )}
                        />
                        <form.Field
                          name="endpoints.status"
                          children={(field) => (
                            <Field className="sm:col-span-2">
                              <FieldLabel htmlFor={field.name}>
                                {t('settings.ai.fields.statusEndpoint')}
                              </FieldLabel>
                              <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="bg-muted/20"
                              />
                              <FieldError
                                errors={field.state.meta.errors.map((e) =>
                                  typeof e === 'string' ? e : String(e),
                                )}
                              />
                            </Field>
                          )}
                        />
                      </>
                    ) : null
                  }
                </form.Subscribe>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Parameters & Actions */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm h-full">
            <div className="flex flex-col space-y-1.5 p-6 pb-4">
              <div className="flex items-center gap-2">
                <IconAdjustments className="size-5 text-primary" />
                <h3 className="text-xl font-semibold leading-none tracking-tight">
                  {t('settings.ai.sections.parameters')}
                </h3>
              </div>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <form.Field
                name="parameters.model"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.model')}</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="bg-muted/20"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === 'string' ? e : String(e),
                      )}
                    />
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field
                  name="parameters.temperature"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('settings.ai.fields.temperature')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.1"
                        min="0"
                        max="2"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />
                <form.Field
                  name="parameters.top_p"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.topP')}</FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.05"
                        min="0"
                        max="1"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />
              </div>

              <form.Field
                name="parameters.max_tokens"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t('settings.ai.fields.maxTokens')}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                      className="bg-muted/20"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === 'string' ? e : String(e),
                      )}
                    />
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <form.Field
                  name="parameters.frequency_penalty"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('settings.ai.fields.frequencyPenalty')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.1"
                        min="-2"
                        max="2"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />
                <form.Field
                  name="parameters.presence_penalty"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('settings.ai.fields.presencePenalty')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="number"
                        step="0.1"
                        min="-2"
                        max="2"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(Number(e.target.value))}
                        className="bg-muted/20"
                      />
                      <FieldError
                        errors={field.state.meta.errors.map((e) =>
                          typeof e === 'string' ? e : String(e),
                        )}
                      />
                    </Field>
                  )}
                />
              </div>

              <form.Field
                name="additionalParams"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      {t('settings.ai.fields.additionalParams')}
                    </FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='{"key": "value"}'
                      className="bg-muted/20"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === 'string' ? e : String(e),
                      )}
                    />
                  </Field>
                )}
              />

              <Separator className="my-2" />

              <div className="flex flex-col gap-2 pt-2">
                <Button
                  type="submit"
                  className="w-full shadow-md"
                  disabled={updateMutation.isPending || !form.state.canSubmit}
                >
                  {updateMutation.isPending ? (
                    <IconLoader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <IconDeviceFloppy className="mr-2 size-4" />
                  )}
                  {t('settings.ai.actions.save')}
                </Button>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleTestConnection}
                    disabled={testMutation.isPending}
                    className="h-auto w-full flex-1 whitespace-normal py-2 text-xs sm:w-auto"
                  >
                    {testMutation.isPending ? (
                      <IconLoader2 className="mr-1 size-3 animate-spin" />
                    ) : (
                      <IconWorldCheck className="mr-1 size-3" />
                    )}
                    {t('settings.ai.actions.test')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    disabled={resetMutation.isPending}
                    className="h-auto w-full flex-1 whitespace-normal py-2 text-xs text-muted-foreground hover:text-destructive sm:w-auto"
                  >
                    <IconRefresh className="mr-1 size-3" />
                    {t('settings.ai.actions.reset')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
