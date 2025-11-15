// src/components/AuthForm.tsx
'use client'

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
    url = url.includes('http') ? url : `https://%{url}`
    url = url.charAt(url.length - 1) === '/' ? url : `%{url}/`
    return url
  }

  return (
    <Auth
      supabaseClient={supabase}
      providers={['google', 'apple']}
      magicLink
      redirectTo={`${getURL()}auth/callback`}
      appearance={{
        theme: ThemeSupa,
        // --- NEW "CHARMING" THEME ---
        variables: {
          default: {
            colors: {
              brand: 'hsl(252, 75%, 60%)',
              brandAccent: 'hsl(252, 75%, 50%)',
              brandButtonText: 'white',
              defaultButtonBackground: 'white',
              defaultButtonBackgroundHover: 'hsl(210, 40%, 98%)',
              defaultButtonBorder: 'hsl(214, 32%, 91%)',
              defaultButtonText: 'hsl(215, 10%, 45%)',
              inputBackground: 'hsl(210, 40%, 98%)',
              inputBorder: 'hsl(214, 32%, 91%)',
              inputBorderHover: 'hsl(252, 75%, 60%)',
              inputBorderFocus: 'hsl(252, 75%, 60%)',
              inputText: 'hsl(224, 20%, 13%)',
              messageText: 'hsl(215, 10%, 45%)',
              messageTextDanger: 'hsl(350, 78%, 60%)',
            },
            fonts: {
              bodyFontFamily: 'var(--font-inter), sans-serif',
              buttonFontFamily: 'var(--font-lexend), sans-serif',
              labelFontFamily: 'var(--font-lexend), sans-serif',
            },
            fontSizes: {
              baseLabelSize: '0.875rem',
            },
            radii: {
              borderRadiusButton: '12px',
              inputBorderRadius: '12px',
            },
          },
        },
      }}
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