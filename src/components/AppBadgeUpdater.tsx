// src/components/AppBadgeUpdater.tsx
'use client'

import { useEffect } from 'react'

type Props = {
  count: number
}

export default function AppBadgeUpdater({ count }: Props) {
  useEffect(() => {
    // Check if the API is available (it is on most modern mobile browsers/PWAs)
    if ('setAppBadge' in navigator) {
      try {
        if (count > 0) {
          navigator.setAppBadge(count)
        } else {
          navigator.clearAppBadge()
        }
      } catch (e) {
        // Ignore errors (e.g. if permission denied)
        console.error('Failed to set app badge', e)
      }
    }
  }, [count])

  return null // This component renders nothing visible
}