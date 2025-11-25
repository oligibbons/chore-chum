'use client'

import { useEffect, useState } from 'react'
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

export default function ServiceWorkerManager() {
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    // 1. Always try to register the Service Worker (Required for PWA installation on all devices)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
          
          // 2. Separately check for Push API support (iOS 16.4+ / Desktop / Android)
          if ('PushManager' in window) {
            setIsPushSupported(true)
            
            const existingSub = await registration.pushManager.getSubscription()
            if (existingSub) {
              setSubscription(existingSub)
            }
          }
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })
    }
  }, [])

  // Global function to trigger permission request
  useEffect(() => {
    (window as any).requestPushPermission = async () => {
      if (!isPushSupported) {
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
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready
          
          const sub = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
          })
          
          setSubscription(sub)
          
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
        console.error(error)
        toast.error("Failed to enable notifications")
      }
    }
  }, [isPushSupported])

  return null
}