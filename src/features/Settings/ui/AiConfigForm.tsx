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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
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
    baseUrl: 'http://192.168.1.107:1234/api/v1',
    port: 1234,
    endpoints: {
      chat: '/chat',
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
      } catch (error) {
        console.error('Failed to save AI config:', error)
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
      } catch (error) {
        console.error('Failed to reset AI config:', error)
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
    form.setFieldValue('provider', provider)
    form.setFieldValue('baseUrl', defaults.baseUrl!)
    form.setFieldValue('port', defaults.port!)
    form.setFieldValue('endpoints.chat', defaults.endpoints!.chat)
    form.setFieldValue('endpoints.models', defaults.endpoints!.models)
    form.setFieldValue('endpoints.load', defaults.endpoints!.load)
    form.setFieldValue('endpoints.download', defaults.endpoints!.download)
    form.setFieldValue('endpoints.status', defaults.endpoints!.status)
    form.setFieldValue('parameters.model', defaults.parameters!.model)
  }

  if (isConfigLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <IconLoader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('settings.ai.title')}</CardTitle>
        <CardDescription>{t('settings.ai.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-8"
        >
          {/* Provider Selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <IconSettings className="size-5 text-primary" />
              <h3>{t('settings.ai.fields.provider')}</h3>
            </div>
            <form.Field
              name="provider"
              children={(field) => (
                <Select value={field.state.value} onValueChange={handleProviderChange}>
                  <SelectTrigger>
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
              )}
            />
          </div>

          <Separator />

          {/* Connection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <IconPlugConnected className="size-5 text-primary" />
              <h3>{t('settings.ai.sections.connection')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field
                name="baseUrl"
                children={(field) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.baseUrl')}</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
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
                    />
                  </Field>
                )}
              />

              <form.Field
                name="timeout"
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.timeout')}</FieldLabel>
                    <Input
                      id={field.name}
                      type="number"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                  </Field>
                )}
              />

              {form.getFieldValue('provider') !== 'lm-studio' && (
                <form.Field
                  name="token"
                  children={(field) => (
                    <Field className="sm:col-span-2">
                      <FieldLabel htmlFor={field.name}>
                        {form.getFieldValue('provider') === 'anthropic'
                          ? t('settings.ai.fields.apiKey')
                          : t('settings.ai.fields.token')}
                      </FieldLabel>
                      <Input
                        id={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="sk-..."
                      />
                    </Field>
                  )}
                />
              )}
            </div>
          </div>

          <Separator />

          {/* Parameters Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <IconAdjustments className="size-5 text-primary" />
              <h3>{t('settings.ai.sections.parameters')}</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <form.Field
                name="parameters.model"
                children={(field) => (
                  <Field className="sm:col-span-2">
                    <FieldLabel htmlFor={field.name}>{t('settings.ai.fields.model')}</FieldLabel>
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              />

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
                    />
                  </Field>
                )}
              />

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
                      step="0.1"
                      min="0"
                      max="1"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(Number(e.target.value))}
                    />
                  </Field>
                )}
              />

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
                    />
                  </Field>
                )}
              />
            </div>
          </div>

          <Separator />

          {/* Endpoints Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-medium">
              <IconPlugConnected className="size-5 text-primary" />
              <h3>{t('settings.ai.sections.endpoints')}</h3>
            </div>
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
                    />
                  </Field>
                )}
              />

              {form.getFieldValue('provider') === 'lm-studio' && (
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
                        />
                      </Field>
                    )}
                  />
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                disabled={resetMutation.isPending}
              >
                <IconRefresh className="mr-2 size-4" />
                {t('settings.ai.actions.reset')}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testMutation.isPending}
              >
                {testMutation.isPending ? (
                  <IconLoader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <IconWorldCheck className="mr-2 size-4" />
                )}
                {t('settings.ai.actions.test')}
              </Button>
            </div>

            <Button
              type="submit"
              size="sm"
              disabled={updateMutation.isPending || !form.state.canSubmit}
            >
              {updateMutation.isPending ? (
                <IconLoader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <IconDeviceFloppy className="mr-2 size-4" />
              )}
              {t('settings.ai.actions.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
