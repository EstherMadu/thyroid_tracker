'use client'

import { useEffect, useState } from 'react'
import { ActionLink, Panel, Pill, Screen } from '@/components/AppShell'
import { SYMPTOM_FIELDS, Symptom, formatDate, scoreTone, supabase, today } from '@/lib/supabase'

const defaultForm = {
  neck_pressure: 3,
  swallowing_pain: 3,
  singing_pain: 3,
  reflux: 3,
  throat_tightness: 3,
  fatigue: 4,
  pulse_awareness: 2,
  bloating: 2,
  sleep_quality: 6,
  notes: '',
}

export default function SymptomsPage() {
  const [form, setForm] = useState(defaultForm)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [history, setHistory] = useState<Symptom[]>([])
  const [saving, setSaving] = useState(false)
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const [todayRes, historyRes] = await Promise.all([
      supabase.from('symptoms').select('*').eq('date', date).maybeSingle(),
      supabase.from('symptoms').select('*').order('date', { ascending: false }).limit(7),
    ])

    if (todayRes.data) {
      const value = todayRes.data as Symptom
      setEntryId(value.id)
      setForm({
        neck_pressure: value.neck_pressure ?? 0,
        swallowing_pain: value.swallowing_pain ?? 0,
        singing_pain: value.singing_pain ?? 0,
        reflux: value.reflux ?? 0,
        throat_tightness: value.throat_tightness ?? 0,
        fatigue: value.fatigue ?? 0,
        pulse_awareness: value.pulse_awareness ?? 0,
        bloating: value.bloating ?? 0,
        sleep_quality: value.sleep_quality ?? 0,
        notes: value.notes ?? '',
      })
    }

    setHistory((historyRes.data as Symptom[] | null) ?? [])
  }

  async function save() {
    setSaving(true)
    const payload = { date, ...form, notes: form.notes || null }
    if (entryId) {
      await supabase.from('symptoms').update(payload).eq('id', entryId)
    } else {
      const { data } = await supabase.from('symptoms').insert(payload).select().single()
      setEntryId((data as Symptom).id)
    }
    setSaving(false)
    void load()
  }

  return (
    <Screen eyebrow={formatDate(date)} title="Symptom scoring" action={<ActionLink href="/insights" label="Insights" />}>
      <Panel>
        <p className="text-sm leading-6 text-slate-300">Score the nine core symptoms from 0 to 10. Lower is better for discomfort, higher is better for sleep quality.</p>
      </Panel>
      {SYMPTOM_FIELDS.map((field) => {
        const value = form[field.key]
        const tone = scoreTone(value, field.direction)
        return (
          <Panel key={field.key}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{field.label}</p>
                <h3 className="mt-1 text-xl text-white">{value}/10</h3>
              </div>
              <Pill className={tone === 'good' ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : tone === 'okay' ? 'border-amber-300/20 bg-amber-500/10 text-amber-100' : 'border-rose-300/20 bg-rose-500/10 text-rose-100'}>
                {tone}
              </Pill>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              value={value}
              onChange={(event) => setForm((current) => ({ ...current, [field.key]: Number(event.target.value) }))}
              className="mt-4"
            />
          </Panel>
        )
      })}
      <Panel>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">Notes</label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
          placeholder="Any changes in voice, throat, reflux, sleep, or bloating?"
          className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
        />
        <button onClick={save} disabled={saving} className="mt-4 w-full rounded-[18px] bg-mint px-4 py-3 text-sm font-semibold text-slate-950">
          {saving ? 'Saving...' : entryId ? 'Update symptoms' : 'Save symptoms'}
        </button>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recent entries</p>
        <div className="mt-4 space-y-3">
          {history.filter((item) => item.date !== date).map((item) => (
            <div key={item.id} className="rounded-[18px] border border-white/10 bg-black/15 p-3">
              <p className="text-sm font-semibold text-white">{formatDate(item.date)}</p>
              <p className="mt-2 text-xs text-slate-400">Reflux {item.reflux ?? 0} · Fatigue {item.fatigue ?? 0} · Sleep {item.sleep_quality ?? 0}</p>
            </div>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}

