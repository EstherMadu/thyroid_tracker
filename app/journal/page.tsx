'use client'

import { useEffect, useState } from 'react'
import { ActionLink, Panel, Screen } from '@/components/AppShell'
import { JournalEntry, formatDate, supabase, today } from '@/lib/supabase'

export default function JournalPage() {
  const [content, setContent] = useState('')
  const [mood, setMood] = useState(3)
  const [entryId, setEntryId] = useState<string | null>(null)
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const [todayRes, allRes] = await Promise.all([
      supabase.from('journal_entries').select('*').eq('date', date).maybeSingle(),
      supabase.from('journal_entries').select('*').order('date', { ascending: false }).limit(10),
    ])
    if (todayRes.data) {
      const entry = todayRes.data as JournalEntry
      setContent(entry.content)
      setMood(entry.mood ?? 3)
      setEntryId(entry.id)
    }
    setEntries((allRes.data as JournalEntry[] | null) ?? [])
  }

  async function save() {
    const payload = { date, content, mood }
    if (entryId) {
      await supabase.from('journal_entries').update(payload).eq('id', entryId)
    } else {
      const { data } = await supabase.from('journal_entries').insert(payload).select().single()
      setEntryId((data as JournalEntry).id)
    }
    void load()
  }

  return (
    <Screen eyebrow={formatDate(date)} title="Daily notes" action={<ActionLink href="/weekly-review" label="Review" />}>
      <Panel>
        <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">Mood</label>
        <input type="range" min={1} max={5} value={mood} onChange={(event) => setMood(Number(event.target.value))} />
        <p className="mt-2 text-sm text-white">{mood}/5</p>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={8} placeholder="What stood out today? Food, pressure, reflux, energy, movement, sleep, or follow-up notes." className="mt-4 w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none" />
        <button onClick={save} className="mt-4 w-full rounded-[18px] bg-mint px-4 py-3 text-sm font-semibold text-slate-950">Save note</button>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Recent notes</p>
        <div className="mt-4 space-y-3">
          {entries.filter((entry) => entry.date !== date).map((entry) => (
            <div key={entry.id} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
              <p className="text-sm font-semibold text-white">{formatDate(entry.date)}</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{entry.content}</p>
            </div>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}

