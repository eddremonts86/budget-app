import { describe, it, expect } from 'vitest'
import { cn } from '@/shared/lib/utils'

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('should handle conditional classes', () => {
    const flags = getFlags()
    expect(cn('a', flags.includeBFalse && 'b', 'c')).toBe('a c')
    expect(cn('a', flags.includeBTrue && 'b', 'c')).toBe('a b c')
  })

  it('should merge tailwind classes correctly', () => {
    // px-2 and px-4 should be merged to px-4
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('should handle complex tailwind merging', () => {
    expect(cn('bg-red-500 p-4', 'bg-blue-500')).toBe('p-4 bg-blue-500')
  })
})

function getFlags() {
  return { includeBFalse: false, includeBTrue: true }
}
