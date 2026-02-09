import { useDebugValue, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'

function is(x: unknown, y: unknown) {
  return (x === y && (0 !== x || 1 / (x as number) === 1 / (y as number))) || (x !== x && y !== y)
}

const objectIs = typeof Object.is === 'function' ? Object.is : is

export function useSyncExternalStoreWithSelector<Snapshot, Selection>(
  subscribe: (onStoreChange: () => void) => () => void,
  getSnapshot: () => Snapshot,
  getServerSnapshot: (() => Snapshot) | undefined | null,
  selector: (snapshot: Snapshot) => Selection,
  isEqual?: (a: Selection, b: Selection) => boolean,
): Selection {
  const instRef = useRef<{ hasValue: boolean; value: Selection | null } | null>(null)
  const memoRef = useRef<{
    hasMemo: boolean
    memoizedSnapshot: Snapshot | undefined
    memoizedSelection: Selection | undefined
  } | null>(null)

  const [getSelection, getServerSelection] = useMemo(() => {
    // We initialize these here because useMemo is safe for initialization
    if (instRef.current === null) {
      instRef.current = { hasValue: false, value: null }
    }
    if (memoRef.current === null) {
      memoRef.current = {
        hasMemo: false,
        memoizedSnapshot: undefined,
        memoizedSelection: undefined,
      }
    }

    const inst = instRef.current
    const memo = memoRef.current

    const memoizedSelector = (nextSnapshot: Snapshot) => {
      if (!memo.hasMemo) {
        memo.hasMemo = true
        memo.memoizedSnapshot = nextSnapshot
        const nextSelection = selector(nextSnapshot)
        if (isEqual !== undefined && inst.hasValue) {
          const currentSelection = inst.value as Selection
          if (isEqual(currentSelection, nextSelection)) {
            memo.memoizedSelection = currentSelection
            return currentSelection
          }
        }
        memo.memoizedSelection = nextSelection
        return nextSelection
      }

      const prevSnapshot = memo.memoizedSnapshot as Snapshot
      const prevSelection = memo.memoizedSelection as Selection

      if (objectIs(prevSnapshot, nextSnapshot)) {
        return prevSelection
      }

      const nextSelection = selector(nextSnapshot)
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        memo.memoizedSnapshot = nextSnapshot
        return prevSelection
      }

      memo.memoizedSnapshot = nextSnapshot
      memo.memoizedSelection = nextSelection
      return nextSelection
    }

    const maybeGetServerSnapshot = getServerSnapshot === undefined ? null : getServerSnapshot

    const getSnapshotWithSelector = () => memoizedSelector(getSnapshot())
    const getServerSnapshotWithSelector =
      maybeGetServerSnapshot === null ? undefined : () => memoizedSelector(maybeGetServerSnapshot())

    return [getSnapshotWithSelector, getServerSnapshotWithSelector]
  }, [getSnapshot, getServerSnapshot, selector, isEqual])

  const value = useSyncExternalStore(subscribe, getSelection, getServerSelection)

  useEffect(() => {
    if (instRef.current) {
      instRef.current.hasValue = true
      instRef.current.value = value
    }
  }, [value])

  useDebugValue(value)
  return value
}
