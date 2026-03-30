'use client'

import { useEffect, useState } from 'react'
import { ActionLink, Panel, Screen } from '@/components/AppShell'
import { WeeklyReview, formatDate, getCurrentWeek, getWeekStartDate, supabase } from '@/lib/supabase'

export default function WeeklyReviewPage() {
  const [programStart, setProgramStart] = useState('')
  const [review, setReview] = useState({ overall_rating: 3, wins: '', challenges: '', goals_next_week: '', trigger_foods: '', notes: '' })
  const [existingId, setExistingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const start = localStorage.getItem('thyroid-week-start') ?? ''
    setProgramStart(start)
    if (start) void load(start)
  }, [])

  async function load(start: string) {
    const weekNumber = getCurrentWeek(start)
    const { data } = await supabase.from('weekly_reviews').select('*').eq('week_number', weekNumber).maybeSingle()
    if (data) {
      const value = data as WeeklyReview
      setExistingId(value.id)
      setReview({
        overall_rating: value.overall_rating ?? 3,
        wins: value.wins ?? '',
        challenges: value.challenges ?? '',
        goals_next_week: value.goals_next_week ?? '',
        trigger_foods: value.trigger_foods ?? '',
        notes: value.notes ?? '',
      })
    }
  }

  async function save() {
    if (!programStart) return
    setSaving(true)
    const weekNumber = getCurrentWeek(programStart)
    const payload = {
      week_number: weekNumber,
      week_start_date: getWeekStartDate(programStart, weekNumber),
      ...review,
    }
    if (existingId) {
      await supabase.from('weekly_reviews').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('weekly_reviews').insert(payload).select().single()
      setExistingId((data as WeeklyReview).id)
    }
    setSaving(false)
  }

  const weekNumber = getCurrentWeek(programStart)
  return (
    <Screen eyebrow={programStart ? `Week ${weekNumber}` : 'Set start date on dashboard'} title="Weekly review" action={<ActionLink href="/progress" label="Progress" />}>
      <Panel>
        <p className="text-sm leading-6 text-slate-300">Every week: review patterns, update trigger foods, and simplify what is not working.</p>
      </Panel>
      <Panel>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">Overall rating</label>
        <input type="range" min={1} max={5} value={review.overall_rating} onChange={(event) => setReview((current) => ({ ...current, overall_rating: Number(event.target.value) }))} />
        <p className="mt-2 text-sm text-white">{review.overall_rating}/5</p>
      </Panel>
      {[
        ['wins', 'What worked well?'],
        ['challenges', 'What kept dragging you off plan?'],
        ['goals_next_week', 'What is the focus for next week?'],
        ['trigger_foods', 'Which foods now look like triggers?'],
        ['notes', 'Medical follow-up or extra notes'],
      ].map(([key, label]) => (
        <Panel key={key}>
          <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">{label}</label>
          <textarea rows={4} value={review[key as keyof typeof review] as string} onChange={(event) => setReview((current) => ({ ...current, [key]: event.target.value }))} className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        </Panel>
      ))}
      <button onClick={save} disabled={saving || !programStart} className="rounded-[18px] bg-mint px-4 py-3 text-sm font-semibold text-slate-950">
        {saving ? 'Saving...' : 'Save weekly review'}
      </button>
    </Screen>
  )
}

