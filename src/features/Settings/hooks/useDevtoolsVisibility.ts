import { useEffect, useState } from 'react'
import { DEVTOOLS_STORAGE_KEY } from '../model'

export function useDevtoolsVisibility(): boolean {
  const [visible, setVisible] = useState<boolean>(() => {
    if (globalThis.window === undefined) return true
    const stored = localStorage.getItem(DEVTOOLS_STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    function handleChange(event: Event) {
      const customEvent = event as CustomEvent<{ visible: boolean }>
      setVisible(customEvent.detail.visible)
    }

    globalThis.addEventListener('devtools-visibility-change', handleChange)
    return () => globalThis.removeEventListener('devtools-visibility-change', handleChange)
  }, [])

  return visible
}
