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
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    // Feature detection for PWA/Push support
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      
      // Register Service Worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          console.log('Service Worker registered with scope:', registration.scope)
          
          // Check if already subscribed
          const existingSub = await registration.pushManager.getSubscription()
          if (existingSub) {
            setSubscription(existingSub)
          }
        })
        .catch((err) => {
          console.error('Service Worker registration failed:', err)
        })
    }
  }, [])

  // Global function to trigger permission request (can be called from Profile/Settings)
  // We attach it to the window object so other components can reach it easily without complex context
  useEffect(() => {
    (window as any).requestPushPermission = async () => {
      if (!isSupported) {
        toast.error("Your device doesn't support push notifications.")
        return
      }

      try {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          const registration = await navigator.serviceWorker.ready
          
          // You must Generate VAPID keys and put the PUBLIC key here
          // Run: npx web-push generate-vapid-keys
          const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

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
  }, [isSupported])

  return null
}