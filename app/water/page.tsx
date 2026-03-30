'use client'

import { useEffect, useState } from 'react'
import { ActionLink, Panel, Screen } from '@/components/AppShell'
import { WATER_GOAL_ML, WATER_STEP_ML, WaterLog, formatDate, supabase, today } from '@/lib/supabase'

export default function WaterPage() {
  const [log, setLog] = useState<WaterLog | null>(null)
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const { data } = await supabase.from('water_logs').select('*').eq('date', date).maybeSingle()
    setLog((data as WaterLog | null) ?? null)
  }

  async function save(nextMl: number) {
    const payload = {
      date,
      ml_total: Math.max(0, nextMl),
      glasses: Math.round(Math.max(0, nextMl) / 300),
    }
    await supabase.from('water_logs').upsert(payload, { onConflict: 'date' })
    setLog({ id: log?.id ?? date, date, ml_total: payload.ml_total, glasses: payload.glasses, created_at: log?.created_at ?? '' })
  }

  const total = log?.ml_total ?? 0
  const percent = Math.min(100, Math.round((total / WATER_GOAL_ML) * 100))

  return (
    <Screen eyebrow={formatDate(date)} title="Water logging" action={<ActionLink href="/" label="Home" />}>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Daily target</p>
        <h2 className="mt-2 text-3xl text-white">{total} ml</h2>
        <div className="mt-4 h-4 rounded-full bg-white/10">
          <div className="h-4 rounded-full bg-gradient-to-r from-sky-400 to-mint" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 text-sm text-slate-300">{percent}% of {WATER_GOAL_ML} ml goal.</p>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quick add</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {[250, 500, 750, 1000].map((amount) => (
            <button key={amount} onClick={() => save(total + amount)} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white">
              +{amount} ml
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-[1fr_auto_auto] gap-3">
          <div className="rounded-[20px] border border-white/10 bg-black/15 px-4 py-4 text-sm text-slate-300">Step size: {WATER_STEP_ML} ml</div>
          <button onClick={() => save(total - WATER_STEP_ML)} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white">-{WATER_STEP_ML}</button>
          <button onClick={() => save(total + WATER_STEP_ML)} className="rounded-[20px] bg-mint px-4 py-4 text-sm font-semibold text-slate-950">+{WATER_STEP_ML}</button>
        </div>
      </Panel>
    </Screen>
  )
}

