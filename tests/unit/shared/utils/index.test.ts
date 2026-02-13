import { describe, expect, it } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold')
  })

  it('resolves tailwind conflicts', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('handles conditional values', () => {
    const includePadding = false
    const includeColor = true
    expect(cn('px-2', includePadding && 'py-2', includeColor && 'text-primary')).toBe(
      'px-2 text-primary',
    )
  })
})
