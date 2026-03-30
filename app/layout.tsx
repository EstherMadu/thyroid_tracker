import { Sora, Fraunces } from 'next/font/google'
import type { Metadata, Viewport } from 'next'
import './globals.css'
import BottomNav from '@/components/BottomNav'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sans',
})

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: 'Thyroid Tracker',
  description:
    'A personal 12-week thyroid wellness command center for food, supplements, symptoms, reflux, hydration, movement, and follow-up.',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#15352d',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sora.variable} ${fraunces.variable} min-h-screen bg-shell text-slate-100 antialiased`}>
        <div className="mx-auto min-h-screen max-w-md px-3 pb-28 pt-3">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  )
}

