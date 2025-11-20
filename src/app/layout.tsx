// src/app/layout.tsx

import { Inter, Lexend } from "next/font/google";
import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner"; // RECOMMENDED: npm install sonner
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
  manifest: "/manifest.json", // Good practice for PWA
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Prevents input zooming on mobile
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