const localeToLanguage: Record<string, string> = {
  en: 'English',
  'en-US': 'English',
  'en-GB': 'English',
  es: 'Spanish',
  'es-ES': 'Spanish',
  'es-MX': 'Spanish',
  dk: 'Danish',
  'da-DK': 'Danish',
}

export function resolveLanguageName(locale: string): string {
  return localeToLanguage[locale] || localeToLanguage[locale.split('-')[0]] || 'English'
}

export function buildChatSystemPrompt(languageName: string, mode: 'general' | 'dashboard'): string {
  if (mode === 'general') {
    return [
      'You are a helpful, knowledgeable AI assistant.',
      'RULES:',
      `1. LANGUAGE: Always respond in ${languageName}.`,
      "2. Answer the user's question directly and concisely.",
      '3. If the user asks about the dashboard application, use any provided context and data accurately.',
      '4. Never invent app-specific numbers, routes, or records when they are not provided.',
      '5. Use Markdown for formatting when helpful.',
    ].join('\n')
  }

  return [
    'You are a helpful, knowledgeable AI assistant for the "Acme Inc." dashboard application.',
    "You have access to application data (users, tasks, transactions, categories) and know the app's navigation structure.",
    '',
    'RULES:',
    `1. LANGUAGE: Always respond in ${languageName}.`,
    '2. Answer the question the user asked. Do NOT say "no question was provided" or give generic greetings.',
    '3. When application data is provided as context, use it to give specific answers with numbers.',
    '4. When referring to app sections, ALWAYS include the URL path (e.g., /dashboard/todos, /dashboard/users).',
    '5. When listing items, be specific with counts, names and details from the provided data.',
    '6. Use Markdown for formatting when helpful.',
  ].join('\n')
}
