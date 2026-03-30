import Link from 'next/link'
import { ReactNode } from 'react'

export function Screen({ title, eyebrow, children, action }: { title: string; eyebrow?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="space-y-4 pb-4">
      <div className="rounded-[28px] border border-line bg-panel p-5 shadow-panel panel-grid">
        {eyebrow && <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p>}
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl leading-none text-sand">{title}</h1>
          </div>
          {action}
        </div>
      </div>
      {children}
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-[24px] border border-line bg-panel p-4 shadow-panel ${className}`}>{children}</section>
}

export function MiniStat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="rounded-[22px] border border-line bg-panel-strong p-3">
      <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

export function Pill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs ${className}`}>{children}</span>
}

export function ActionLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200"
    >
      {label}
    </Link>
  )
}

