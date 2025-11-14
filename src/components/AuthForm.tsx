// components/AuthForm.tsx

'use client' // This MUST be a Client Component

import { useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // This import is correct
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

export default function AuthForm() {
  // Create a Supabase client (for the browser)
  // We use useState to ensure it's only created once per component load
  const [supabase] = useState(() =>
    // --- THIS IS THE FIX ---
    // It takes no arguments, as it reads from the environment automatically.
    createClientComponentClient()
    // --- END OF FIX ---
  )

  return (
    <Auth
      supabaseClient={supabase}
      providers={['google', 'apple']}
      magicLink
      appearance={{
        theme: ThemeSupa,
        variables: {
          default: {
            colors: {
              brand: '#b02e46',
              brandAccent: '#ad8ae1',
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
            magic_link_text: 'Send magic link',
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