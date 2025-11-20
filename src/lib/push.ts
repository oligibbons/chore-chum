import webPush from 'web-push'

// Configure VAPID
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(
    'mailto:support@chorechum.com', 
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
    // 410 Gone and 404 Not Found mean the subscription is no longer valid
    if (error.statusCode === 410 || error.statusCode === 404) {
      return false
    }
    console.error('Error sending push notification:', error)
    throw error
  }
}