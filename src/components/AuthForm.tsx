// components/AuthForm.tsx

'use client' // This MUST be a Client Component

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthForm() {
  const [supabase] = useState(() =>
    createSupabaseBrowserClient()
  )

  // Get the origin URL for the redirect
  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this in Vercel/Cloudflare
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel
      'http://localhost:3000/'
    // Make sure to include `https://` when not localhost.
    url = url.includes('http') ? url : `https://${url}`
    // Make sure to include a trailing `/`.
    url = url.charAt(url.length - 1) === '/' ? url : `${url}/`
    return url
  }

  return (
    <Auth
      supabaseClient={supabase}
      providers={['google', 'apple']}
      magicLink
      // We need to tell the Auth helper where our callback route is
      redirectTo={`${getURL()}auth/callback`}
      appearance={{
        theme: ThemeSupa, // Start with the default Supabase theme
        variables: {
          // ...and override it with your brand colours
          default: {
            colors: {
              brand: '#b02e46', // Your brand-primary
              brandAccent: '#ad8ae1', // Your brand-secondary
              brandButtonText: '#FFFFFF',
              defaultButtonBackground: '#FFFFFF',
              defaultButtonBackgroundHover: '#f9f9f9',
              defaultButtonBorder: '#cccecf',
              defaultButtonText: '#303030',
              inputBackground: '#FFFFFF',
              inputBorder: '#cccecf',
              inputBorderHover: '#b02e46',
              inputBorderFocus: '#b02e46',
              inputText: '#303030',
              messageText: '#303030',
              messageTextDanger: '#D92D20',
            },
            fonts: {
              bodyFontFamily: 'var(--font-inter)',
              buttonFontFamily: 'var(--font-lexend)',
              labelFontFamily: 'var(--font-lexend)',
            },
            fontSizes: {
              baseLabelSize: '0.875rem',
            },
            radii: {
              borderRadiusButton: '8px',
              inputBorderRadius: '8px',
            },
          },
        },
      }}
      // Use British English for all UI text
      localization={{
        variables: {
          sign_in: {
            email_label: 'Email address',
            password_label: 'Password',
            email_input_placeholder: 'Your email address',
            password_input_placeholder: 'Your password',
            button_label: 'Sign in',
            social_provider_text: 'Sign in with {{provider}}',
            link_text: 'Already have an account? Sign in',
          },
          sign_up: {
            email_label: 'Email address',
            password_label: 'Password',
            email_input_placeholder: 'Your email address',
            password_input_placeholder: 'Your password',
            button_label: 'Sign up',
            social_provider_text: 'Sign up with {{provider}}',
            link_text: "Don't have an account? Sign up",
            confirmation_text:
              'Check your email for the confirmation link',
          },
          magic_link: {
            email_input_label: 'Email address',
            email_input_placeholder: 'Your email address',
            button_label: 'Send magic link',
            link_text: 'Send a magic link instead',
            confirmation_text: 'Check your email for the magic link',
          },
          forgotten_password: {
            email_label: 'Email address',
            email_input_placeholder: 'Your email address',
            button_label: "Send reset instructions",
            link_text: 'Forgot your password?',
            confirmation_text:
              'Check your email for the password reset link',
          },
        },
      }}
    />
  )
}