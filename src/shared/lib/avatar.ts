function decodeSeed(value: string | null) {
  if (!value) {
    return ''
  }

  try {
    return decodeURIComponent(value.replace(/\+/g, ' '))
  } catch {
    return value
  }
}

function getInitials(seed: string) {
  const parts = seed.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const initials = parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '?'
}

function getHue(seed: string) {
  let hash = 0

  for (const character of seed) {
    hash = (hash * 31 + character.charCodeAt(0)) % 360
  }

  return Math.abs(hash) % 360
}

export function createInitialsAvatarDataUrl(seed: string) {
  const normalizedSeed = seed.trim() || 'User'
  const initials = getInitials(normalizedSeed)
  const hue = getHue(normalizedSeed)
  const background = `hsl(${hue} 62% 54%)`
  const accent = `hsl(${(hue + 28) % 360} 68% 42%)`
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="${initials}">
      <defs>
        <linearGradient id="avatarGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${background}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="24" fill="url(#avatarGradient)" />
      <text x="50%" y="53%" dominant-baseline="middle" text-anchor="middle" fill="white" font-family="ui-sans-serif, system-ui, sans-serif" font-size="34" font-weight="700" letter-spacing="1">${initials}</text>
    </svg>
  `.trim()

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function getSafeAvatarSrc(src: string | null | undefined) {
  if (!src) {
    return src
  }

  if (!src.includes('api.dicebear.com')) {
    return src
  }

  try {
    const url = new URL(src)
    const seed = decodeSeed(url.searchParams.get('seed')) || 'User'

    return createInitialsAvatarDataUrl(seed)
  } catch {
    return createInitialsAvatarDataUrl('User')
  }
}
