'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionLink, Panel, Pill, Screen } from '@/components/AppShell'
import { DEFAULT_SUPPLEMENTS, SupplementLog, formatDate, supabase, today } from '@/lib/supabase'

export default function SupplementsPage() {
  const [logs, setLogs] = useState<SupplementLog[]>([])
  const [customName, setCustomName] = useState('')
  const [customReminder, setCustomReminder] = useState('20:00')
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const { data } = await supabase.from('supplement_logs').select('*').eq('date', date)
    const existing = (data as SupplementLog[] | null) ?? []
    const defaults = DEFAULT_SUPPLEMENTS.map((item) => {
      const found = existing.find((entry) => entry.name === item.name)
      return (
        found ?? {
          id: item.name,
          date,
          name: item.name,
          taken: false,
          dosage_mg: Number.parseInt(item.dosage, 10) || null,
          time_taken: null,
          created_at: '',
        }
      )
    })
    const customLogs = existing.filter((entry) => !DEFAULT_SUPPLEMENTS.some((item) => item.name === entry.name))
    setLogs([...defaults, ...customLogs])
  }

  async function toggle(name: string, taken: boolean) {
    const time = taken ? new Date().toISOString() : null
    setLogs((current) => current.map((entry) => (entry.name === name ? { ...entry, taken, time_taken: time } : entry)))
    await supabase.from('supplement_logs').upsert({ date, name, taken, time_taken: time }, { onConflict: 'date,name' })
  }

  async function addCustom() {
    if (!customName.trim()) return
    const newLog: SupplementLog = {
      id: customName,
      date,
      name: customName.trim(),
      taken: false,
      dosage_mg: null,
      time_taken: null,
      created_at: '',
    }
    setLogs((current) => [...current, newLog])
    setCustomName('')
    await supabase.from('supplement_logs').upsert({ date, name: newLog.name, taken: false }, { onConflict: 'date,name' })
  }

  const summary = useMemo(() => {
    const taken = logs.filter((entry) => entry.taken).length
    return {
      taken,
      total: logs.length,
      percent: logs.length ? Math.round((taken / logs.length) * 100) : 0,
      missed: logs.length - taken,
    }
  }, [logs])

  return (
    <Screen eyebrow={formatDate(date)} title="Supplement tracking" action={<ActionLink href="/" label="Home" />}>
      <Panel>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Taken</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.taken}</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Missed</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.missed}</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Adherence</p>
            <p className="mt-2 text-2xl font-semibold text-white">{summary.percent}%</p>
          </div>
        </div>
        <div className="mt-4 rounded-[20px] border border-white/10 bg-black/15 p-4">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reminder setup</p>
          <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
            <input
              value={customReminder}
              onChange={(event) => setCustomReminder(event.target.value)}
              type="time"
              className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            />
            <Pill className="border-amber-300/20 bg-amber-500/10 text-amber-100">email optional</Pill>
          </div>
          <p className="mt-2 text-xs text-slate-400">Use this time as the target for browser notifications and Vercel cron reminder summaries.</p>
        </div>
      </Panel>

      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Protocol</p>
        <div className="mt-4 space-y-3">
          {logs.map((entry) => {
            const defaultMeta = DEFAULT_SUPPLEMENTS.find((item) => item.name === entry.name)
            return (
              <div key={entry.name} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{entry.name}</p>
                    <p className="mt-1 text-xs text-slate-400">{defaultMeta?.dosage ?? 'Custom reminder'}</p>
                  </div>
                  <button
                    onClick={() => toggle(entry.name, !entry.taken)}
                    className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${entry.taken ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
                  >
                    {entry.taken ? 'taken' : 'mark taken'}
                  </button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Pill className={entry.taken ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-rose-300/20 bg-rose-500/10 text-rose-100'}>
                    {entry.taken ? 'adherent' : 'missed'}
                  </Pill>
                  {entry.time_taken && <Pill className="border-white/10 bg-white/5 text-slate-300">{new Date(entry.time_taken).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Pill>}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Custom reminder</p>
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-3">
          <input
            value={customName}
            onChange={(event) => setCustomName(event.target.value)}
            placeholder="Add custom supplement"
            className="rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
          />
          <button onClick={addCustom} className="rounded-[18px] bg-white px-4 py-3 text-sm font-semibold text-slate-950">
            Add
          </button>
        </div>
      </Panel>
    </Screen>
  )
}

