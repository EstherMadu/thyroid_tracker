'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/', label: 'Home' },
  { href: '/meals', label: 'Meals' },
  { href: '/symptoms', label: 'Symptoms' },
  { href: '/progress', label: 'Progress' },
  { href: '/more', label: 'More' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 px-3">
      <div className="mx-auto flex max-w-md items-center justify-between rounded-[26px] border border-white/10 bg-[#101917]/90 px-2 py-2 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-xl">
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-0 flex-1 flex-col items-center rounded-[18px] px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] transition ${
                active ? 'bg-white/10 text-mint' : 'text-slate-400'
              }`}
            >
              <span className="mb-1 block h-1.5 w-8 rounded-full bg-current opacity-80" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

