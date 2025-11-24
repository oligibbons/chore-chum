// src/app/layout.tsx

import { Inter, Lexend } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner"; 
import ServiceWorkerManager from '@/components/ServiceWorkerManager';
import "./global.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-lexend",
});

export const metadata: Metadata = {
  title: "ChoreChum",
  description: "Your friendly household chore manager.",
  manifest: "/manifest.json",
  icons: {
    // Updated to point to your new PNGs instead of the old SVG
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    shortcut: '/icon-192.png',
    apple: '/icon-192.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/icon-192.png',
    },
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ChoreChum",
  },
};

export const viewport: Viewport = {
  themeColor: "#8b5cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, 
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lexend.variable} bg-background font-sans text-foreground antialiased`}
      >
        <ServiceWorkerManager />
        {children}
        <Toaster 
          position="top-center" 
          richColors 
          closeButton
          theme="light"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-lexend)',
              borderRadius: '12px',
            }
          }}
        />
      </body>
    </html>
  );
}