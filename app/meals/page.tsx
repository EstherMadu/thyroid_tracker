'use client'

import { useEffect, useMemo, useState } from 'react'
import { ActionLink, Panel, Pill, Screen } from '@/components/AppShell'
import {
  MEAL_TYPES,
  NIGERIAN_MEAL_LIBRARY,
  Meal,
  MealType,
  formatDate,
  getFoodReference,
  statusClasses,
  supabase,
  today,
  toDateTime,
} from '@/lib/supabase'

const emptyForm = {
  meal_type: 'breakfast' as MealType,
  food_name: '',
  portion_size: '',
  time: new Date().toTimeString().slice(0, 5),
  reflux: false,
  pressure: false,
  bloating: false,
  notes: '',
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const date = today()

  useEffect(() => {
    void load()
  }, [date])

  async function load() {
    const { data } = await supabase.from('meals').select('*').eq('date', date).order('logged_at')
    setMeals((data as Meal[] | null) ?? [])
  }

  const suggestions = useMemo(() => {
    const base = NIGERIAN_MEAL_LIBRARY.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
    return base.slice(0, 8)
  }, [search])

  const foodReference = form.food_name ? getFoodReference(form.food_name) : null

  async function saveMeal() {
    if (!form.food_name.trim()) return
    setSaving(true)
    const payload = {
      date,
      meal_type: form.meal_type,
      food_name: form.food_name.trim(),
      portion_size: form.portion_size || null,
      logged_at: toDateTime(date, form.time),
      flags: {
        reflux: form.reflux,
        pressure: form.pressure,
        bloating: form.bloating,
      },
      notes: form.notes || null,
      food_status: foodReference?.status ?? null,
      triggers: [form.reflux && 'reflux', form.pressure && 'pressure', form.bloating && 'bloating'].filter(Boolean),
    }

    const { data } = await supabase.from('meals').insert(payload).select().single()
    setMeals((current) => [...current, data as Meal].sort((a, b) => (a.logged_at ?? '').localeCompare(b.logged_at ?? '')))
    setForm(emptyForm)
    setSearch('')
    setSaving(false)
  }

  async function deleteMeal(id: string) {
    await supabase.from('meals').delete().eq('id', id)
    setMeals((current) => current.filter((meal) => meal.id !== id))
  }

  return (
    <Screen eyebrow={formatDate(date)} title="Meal tracking" action={<ActionLink href="/" label="Command" />}>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Add meal</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {MEAL_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setForm((current) => ({ ...current, meal_type: type }))}
              className={`rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
                form.meal_type === type ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Food name</label>
            <input
              value={form.food_name}
              onChange={(event) => {
                setForm((current) => ({ ...current, food_name: event.target.value }))
                setSearch(event.target.value)
              }}
              placeholder="White rice and fish stew"
              className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
          {suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setForm((current) => ({ ...current, food_name: item }))
                    setSearch(item)
                  }}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200"
                >
                  {item}
                </button>
              ))}
            </div>
          )}
          {foodReference && (
            <div className={`rounded-[18px] border px-3 py-3 text-sm ${statusClasses(foodReference.status)}`}>
              <p className="font-semibold">Food guide: {foodReference.status}</p>
              <p className="mt-1 text-xs opacity-90">Category: {foodReference.category}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Portion</label>
              <input
                value={form.portion_size}
                onChange={(event) => setForm((current) => ({ ...current, portion_size: event.target.value }))}
                placeholder="1 medium plate"
                className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Time eaten</label>
              <input
                type="time"
                value={form.time}
                onChange={(event) => setForm((current) => ({ ...current, time: event.target.value }))}
                className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
              />
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-400">Flags</p>
            <div className="flex flex-wrap gap-2">
              {[
                ['reflux', 'Reflux'],
                ['pressure', 'Pressure'],
                ['bloating', 'Bloating'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setForm((current) => ({ ...current, [key]: !current[key as keyof typeof current] }))}
                  className={`rounded-full border px-3 py-2 text-xs font-semibold ${
                    form[key as keyof typeof form] ? 'border-rose-300/20 bg-rose-500/10 text-rose-100' : 'border-white/10 bg-white/5 text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.22em] text-slate-400">Notes</label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              placeholder="What happened after this meal?"
              className="w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none"
            />
          </div>
          <button onClick={saveMeal} disabled={saving} className="w-full rounded-[18px] bg-mint px-4 py-3 text-sm font-semibold text-slate-950">
            {saving ? 'Saving...' : 'Save meal'}
          </button>
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Library</p>
            <h3 className="mt-1 text-xl text-white">Nigerian meal ideas</h3>
          </div>
          <Pill className="border-white/10 bg-white/5 text-slate-300">preloaded</Pill>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {NIGERIAN_MEAL_LIBRARY.slice(0, 14).map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-200">
              {item}
            </span>
          ))}
        </div>
      </Panel>

      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today&apos;s meals</p>
        <div className="mt-4 space-y-3">
          {meals.length === 0 && <p className="text-sm text-slate-400">No meals logged today yet.</p>}
          {meals.map((meal) => (
            <div key={meal.id} className="rounded-[20px] border border-white/10 bg-black/15 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Pill className="border-white/10 bg-white/5 text-slate-300">{meal.meal_type}</Pill>
                    {meal.food_status && <Pill className={statusClasses(meal.food_status)}>{meal.food_status}</Pill>}
                  </div>
                  <p className="mt-2 text-sm font-semibold text-white">{meal.food_name}</p>
                  <p className="mt-1 text-xs text-slate-400">{meal.portion_size || 'portion not set'} · {meal.logged_at ? new Date(meal.logged_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--'}</p>
                  {meal.notes && <p className="mt-2 text-sm leading-6 text-slate-300">{meal.notes}</p>}
                </div>
                <button onClick={() => deleteMeal(meal.id)} className="text-xs uppercase tracking-[0.2em] text-rose-200">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </Screen>
  )
}

