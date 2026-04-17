'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { subscribeUserToPush } from '@/app/push-actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// 1. Bind the function securely outside the React render cycle to prevent race conditions.
if (typeof window !== 'undefined') {
  (window as any).requestPushPermission = async () => {
    // Synchronous checks to ensure iOS Safari doesn't block the prompt
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast.error("Your device supports the app, but not push notifications (iOS 16.4+ required).")
      return
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidPublicKey) {
      console.error("VAPID Public Key is missing in environment variables.")
      toast.error("Notifications not configured by server.")
      return
    }

    try {
      // 2. IMMEDIATE permission request (Crucial for iOS Apple guidelines)
      const permission = await Notification.requestPermission()
      
      if (permission === 'granted') {
        // Only after permission is granted do we start doing async background work
        const registration = await navigator.serviceWorker.ready
        
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
        
        // Send to server
        const result = await subscribeUserToPush(JSON.parse(JSON.stringify(sub)))
        if (result.success) {
           toast.success("Notifications enabled! 🔔")
        } else {
           toast.error("Failed to save subscription")
        }

      } else {
        toast.error("Permission denied for notifications")
      }
    } catch (error) {
      console.error('Push setup error:', error)
      toast.error("Failed to enable notifications")
    }
  }
}

export default function ServiceWorkerManager() {
  
  useEffect(() => {
    // 3. Register the Service Worker (Required for PWA installation on all devices)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })
    }
  }, [])

  return null
}