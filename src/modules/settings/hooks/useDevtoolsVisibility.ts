import { useEffect, useState } from 'react'
import { DEVTOOLS_STORAGE_KEY } from '../model'

export function useDevtoolsVisibility(): boolean {
  // Initialize to false (or true) consistently for hydration
  const [visible, setVisible] = useState<boolean>(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
    const stored = localStorage.getItem(DEVTOOLS_STORAGE_KEY)
    // Default to true if not stored
    setVisible(stored === null ? true : stored === 'true')
  }, [])

  useEffect(() => {
    function handleChange(event: Event) {
      const customEvent = event as CustomEvent<{ visible: boolean }>
      setVisible(customEvent.detail.visible)
    }

    globalThis.addEventListener('devtools-visibility-change', handleChange)
    return () => globalThis.removeEventListener('devtools-visibility-change', handleChange)
  }, [])

  // During SSR and initial hydration, return false (or true, but must be consistent)
  // We return false to avoid flashing devtools if they are disabled
  if (!mounted) return false

  return visible
}
