'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionLink, Panel, Pill, Screen } from '@/components/AppShell'
import { DAILY_STEP_GOAL, EXERCISE_TYPES, ExerciseLog, formatDate, formatStepCount, supabase, toDateTime, today } from '@/lib/supabase'

type ExerciseForm = {
  exercise_type: (typeof EXERCISE_TYPES)[number]
  duration_minutes: number
  step_count: number
  intensity: 'low' | 'medium' | 'high'
  before_feeling: string
  after_feeling: string
  time: string
  notes: string
}

const emptyForm: ExerciseForm = {
  exercise_type: EXERCISE_TYPES[0],
  duration_minutes: 20,
  step_count: 2500,
  intensity: 'low',
  before_feeling: '',
  after_feeling: '',
  time: '19:00',
  notes: '',
}

export default function ExercisePage() {
  const [logs, setLogs] = useState<ExerciseLog[]>([])
  const [form, setForm] = useState<ExerciseForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const { data } = await supabase.from('exercise_logs').select('*').eq('date', date).order('logged_at')
    setLogs((data as ExerciseLog[] | null) ?? [])
  }

  async function save() {
    setSaving(true)
    const { data } = await supabase
      .from('exercise_logs')
      .insert({
        date,
        exercise_type: form.exercise_type,
        duration_minutes: form.duration_minutes,
        step_count: form.exercise_type === 'Walk' ? form.step_count : null,
        intensity: form.intensity,
        before_feeling: form.before_feeling || null,
        after_feeling: form.after_feeling || null,
        logged_at: toDateTime(date, form.time),
        notes: form.notes || null,
      })
      .select()
      .single()
    setLogs((current) => [...current, data as ExerciseLog])
    setForm(emptyForm)
    setSaving(false)
  }

  async function remove(id: string) {
    await supabase.from('exercise_logs').delete().eq('id', id)
    setLogs((current) => current.filter((item) => item.id !== id))
  }

  const todaySteps = useMemo(() => logs.reduce((sum, entry) => sum + (entry.step_count ?? 0), 0), [logs])
  const walkLogs = logs.filter((entry) => entry.exercise_type === 'Walk')

  return (
    <Screen eyebrow={formatDate(date)} title="Evening movement" action={<ActionLink href="/progress" label="Monthly steps" />}>
      <Panel>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today&apos;s steps</p>
            <p className="mt-2 text-3xl text-white">{formatStepCount(todaySteps)}</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Walk goal</p>
            <p className="mt-2 text-3xl text-white">{Math.round((todaySteps / DAILY_STEP_GOAL) * 100) || 0}%</p>
            <p className="mt-1 text-xs text-slate-400">{formatStepCount(DAILY_STEP_GOAL)} daily target</p>
          </div>
        </div>
      </Panel>
      <Panel>
        <p className="text-sm leading-6 text-slate-300">Use movement as a consistency tool, not a performance test. Walk, stretch, low-impact work, yoga, and breathing all count.</p>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Log session</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {EXERCISE_TYPES.map((item) => (
            <button
              key={item}
              onClick={() => setForm((current) => ({ ...current, exercise_type: item, step_count: item === 'Walk' ? current.step_count : 0 }))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold ${form.exercise_type === item ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Duration</label>
            <input type="number" min={5} step={5} value={form.duration_minutes} onChange={(event) => setForm((current) => ({ ...current, duration_minutes: Number(event.target.value) }))} className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Time</label>
            <input type="time" value={form.time} onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))} className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          </div>
        </div>
        {form.exercise_type === 'Walk' && (
          <div className="mt-3">
            <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Step count</label>
            <input type="number" min={0} step={100} value={form.step_count} onChange={(event) => setForm((current) => ({ ...current, step_count: Number(event.target.value) }))} className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
            <p className="mt-2 text-xs text-slate-400">Manual daily entry works well if you copy steps from your phone or watch.</p>
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {['low', 'medium', 'high'].map((item) => (
            <button
              key={item}
              onClick={() => setForm((current) => ({ ...current, intensity: item as ExerciseForm['intensity'] }))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase ${form.intensity === item ? 'border-sky-300/20 bg-sky-500/10 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <input value={form.before_feeling} onChange={(event) => setForm((current) => ({ ...current, before_feeling: event.target.value }))} placeholder="Before: tired, tight, stressed" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          <input value={form.after_feeling} onChange={(event) => setForm((current) => ({ ...current, after_feeling: event.target.value }))} placeholder="After: lighter, calmer, looser" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
          <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="Anything worth remembering?" className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </div>
        <button onClick={save} disabled={saving} className="mt-4 w-full rounded-[18px] bg-mint px-4 py-3 text-sm font-semibold text-slate-950">
          {saving ? 'Saving...' : 'Save movement'}
        </button>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today&apos;s sessions</p>
          <Pill className="border-white/10 bg-white/5 text-slate-300">{walkLogs.length} walks</Pill>
        </div>
        <div className="mt-4 space-y-3">
          {logs.length === 0 && <p className="text-sm text-slate-400">No movement logged yet.</p>}
          {logs.map((entry) => (
            <div key={entry.id} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-white">{entry.exercise_type}</p>
                    <Pill className="border-white/10 bg-white/5 text-slate-300">{entry.intensity || 'low'}</Pill>
                    {entry.step_count ? <Pill className="border-emerald-300/20 bg-emerald-500/10 text-emerald-100">{formatStepCount(entry.step_count)} steps</Pill> : null}
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{entry.duration_minutes ?? 0} min · {entry.logged_at ? new Date(entry.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                  {(entry.before_feeling || entry.after_feeling) && <p className="mt-2 text-sm text-slate-300">Before: {entry.before_feeling || '--'} | After: {entry.after_feeling || '--'}</p>}
                </div>
                <button onClick={() => remove(entry.id)} className="text-xs uppercase tracking-[0.2em] text-rose-200">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}
