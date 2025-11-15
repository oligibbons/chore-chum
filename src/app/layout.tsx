import { Inter, Lexend } from "next/font/google";
import type { Metadata } from "next";
import "./global.css"; // <-- THIS IS THE FIX

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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${lexend.variable} bg-background font-sans text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}