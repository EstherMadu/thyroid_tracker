'use client'

import { useEffect, useState } from 'react'
import { ActionLink, Panel, Pill, Screen } from '@/components/AppShell'
import { computeInsights } from '@/lib/insights'
import { ExerciseLog, Meal, SupplementLog, Symptom, WaterLog, supabase } from '@/lib/supabase'

export default function InsightsPage() {
  const [insights, setInsights] = useState<ReturnType<typeof computeInsights>>([])

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    const since = new Date()
    since.setDate(since.getDate() - 6)
    const start = since.toISOString().split('T')[0]
    const previous = new Date()
    previous.setDate(previous.getDate() - 13)
    const previousStart = previous.toISOString().split('T')[0]

    const [mealsRes, supplementsRes, symptomsRes, exerciseRes, waterRes, previousRes] = await Promise.all([
      supabase.from('meals').select('*').gte('date', start),
      supabase.from('supplement_logs').select('*').gte('date', start),
      supabase.from('symptoms').select('*').gte('date', start),
      supabase.from('exercise_logs').select('*').gte('date', start),
      supabase.from('water_logs').select('*').gte('date', start),
      supabase.from('symptoms').select('*').gte('date', previousStart).lt('date', start),
    ])

    setInsights(
      computeInsights({
        meals: (mealsRes.data as Meal[] | null) ?? [],
        supplements: (supplementsRes.data as SupplementLog[] | null) ?? [],
        symptoms: (symptomsRes.data as Symptom[] | null) ?? [],
        exercise: (exerciseRes.data as ExerciseLog[] | null) ?? [],
        water: (waterRes.data as WaterLog[] | null) ?? [],
        prevWeekSymptoms: (previousRes.data as Symptom[] | null) ?? [],
      })
    )
  }

  return (
    <Screen eyebrow="Last 7 days" title="Rule-based insights" action={<ActionLink href="/progress" label="Progress" />}>
      <Panel>
        <p className="text-sm leading-6 text-slate-300">These patterns are for personal tracking only. They help highlight timing, trigger food repetition, supplement adherence, and symptom drift.</p>
      </Panel>
      {insights.map((insight) => (
        <Panel key={insight.id}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Priority {insight.priority}</p>
              <h3 className="mt-1 text-xl text-white">{insight.title}</h3>
            </div>
            <Pill className={insight.type === 'good' ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : insight.type === 'info' ? 'border-sky-300/20 bg-sky-500/10 text-sky-100' : insight.type === 'warning' ? 'border-amber-300/20 bg-amber-500/10 text-amber-100' : 'border-rose-300/20 bg-rose-500/10 text-rose-100'}>{insight.type}</Pill>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{insight.message}</p>
        </Panel>
      ))}
    </Screen>
  )
}

