import webPush from 'web-push'

// Configure the VAPID details once when the module loads
// These env vars must be set in your .env.local and Vercel project settings
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:support@chorechum.com', // Replace with your actual support email
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
} else {
  console.warn('VAPID keys are missing. Push notifications will not work.')
}

export type PushPayload = {
  title: string
  body: string
  url?: string
}

/**
 * Sends a push notification to a specific subscription.
 * Returns true if successful, false if the subscription is invalid (410/404).
 */
export async function sendNotification(
  subscription: webPush.PushSubscription,
  payload: PushPayload
): Promise<boolean> {
  try {
    await webPush.sendNotification(
      subscription,
      JSON.stringify(payload)
    )
    return true
  } catch (error: any) {
    if (error.statusCode === 410 || error.statusCode === 404) {
      // The subscription has expired or is no longer valid
      return false
    }
    console.error('Error sending push notification:', error)
    throw error
  }
}