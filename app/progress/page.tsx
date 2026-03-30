'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ActionLink, Panel, Screen } from '@/components/AppShell'
import { DAILY_STEP_GOAL, DEFAULT_SUPPLEMENTS, ExerciseLog, Meal, MONTHLY_STEP_GOAL, SupplementLog, Symptom, WaterLog, formatStepCount, getCurrentWeek, supabase } from '@/lib/supabase'

function weekNumberForDate(programStart: string, date: string) {
  const start = new Date(`${programStart}T00:00:00`)
  const current = new Date(`${date}T00:00:00`)
  const diffDays = Math.floor((current.getTime() - start.getTime()) / 86400000)
  if (diffDays < 0) return 1
  return Math.min(12, Math.floor(diffDays / 7) + 1)
}

function getMonthInfo() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  return {
    monthStart: start.toISOString().split('T')[0],
    monthLabel: now.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }
}

export default function ProgressPage() {
  const [weekStart, setWeekStart] = useState('')
  const [weekData, setWeekData] = useState<{ week: string; adherence: number; reflux: number; water: number }[]>([])
  const [monthlyStepData, setMonthlyStepData] = useState<{ day: string; steps: number }[]>([])
  const [summary, setSummary] = useState({ meals: 0, exercise: 0, symptoms: 0, records: 0 })
  const [stepSummary, setStepSummary] = useState({ total: 0, average: 0, best: 0, streak: 0, walkDays: 0, monthLabel: '' })

  useEffect(() => {
    const start = localStorage.getItem('thyroid-week-start') ?? ''
    setWeekStart(start)
    void load(start)
  }, [])

  async function load(start: string) {
    const monthInfo = getMonthInfo()
    const [mealsRes, supplementsRes, symptomsRes, waterRes, exerciseRes, recordsRes, monthExerciseRes] = await Promise.all([
      supabase.from('meals').select('*').order('date'),
      supabase.from('supplement_logs').select('*').order('date'),
      supabase.from('symptoms').select('*').order('date'),
      supabase.from('water_logs').select('*').order('date'),
      supabase.from('exercise_logs').select('*').order('date'),
      supabase.from('medical_records').select('id'),
      supabase.from('exercise_logs').select('*').gte('date', monthInfo.monthStart).order('date'),
    ])

    const meals = (mealsRes.data as Meal[] | null) ?? []
    const supplements = (supplementsRes.data as SupplementLog[] | null) ?? []
    const symptoms = (symptomsRes.data as Symptom[] | null) ?? []
    const water = (waterRes.data as WaterLog[] | null) ?? []
    const exercise = (exerciseRes.data as ExerciseLog[] | null) ?? []
    const monthExercise = (monthExerciseRes.data as ExerciseLog[] | null) ?? []

    const weekMap = new Map<number, { adherenceHits: number; adherenceTotal: number; refluxTotal: number; refluxCount: number; waterTotal: number; waterCount: number }>()
    const weekOf = (date: string) => (start ? weekNumberForDate(start, date) : 1)

    supplements.forEach((entry) => {
      const number = weekOf(entry.date)
      const row = weekMap.get(number) ?? { adherenceHits: 0, adherenceTotal: 0, refluxTotal: 0, refluxCount: 0, waterTotal: 0, waterCount: 0 }
      if (DEFAULT_SUPPLEMENTS.some((item) => item.name === entry.name)) {
        row.adherenceTotal += 1
        if (entry.taken) row.adherenceHits += 1
      }
      weekMap.set(number, row)
    })

    symptoms.forEach((entry) => {
      const number = weekOf(entry.date)
      const row = weekMap.get(number) ?? { adherenceHits: 0, adherenceTotal: 0, refluxTotal: 0, refluxCount: 0, waterTotal: 0, waterCount: 0 }
      row.refluxTotal += entry.reflux ?? 0
      row.refluxCount += typeof entry.reflux === 'number' ? 1 : 0
      weekMap.set(number, row)
    })

    water.forEach((entry) => {
      const number = weekOf(entry.date)
      const row = weekMap.get(number) ?? { adherenceHits: 0, adherenceTotal: 0, refluxTotal: 0, refluxCount: 0, waterTotal: 0, waterCount: 0 }
      row.waterTotal += entry.ml_total ?? 0
      row.waterCount += 1
      weekMap.set(number, row)
    })

    const chart = Array.from(weekMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, values]) => ({
        week: `W${week}`,
        adherence: values.adherenceTotal ? Math.round((values.adherenceHits / values.adherenceTotal) * 100) : 0,
        reflux: values.refluxCount ? Number((values.refluxTotal / values.refluxCount).toFixed(1)) : 0,
        water: values.waterCount ? Math.round(values.waterTotal / values.waterCount) : 0,
      }))

    const dailyStepMap = new Map<string, number>()
    monthExercise.forEach((entry) => {
      dailyStepMap.set(entry.date, (dailyStepMap.get(entry.date) ?? 0) + (entry.step_count ?? 0))
    })

    const monthlyChart = Array.from(dailyStepMap.entries()).map(([date, steps]) => ({
      day: new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      steps,
    }))

    const dailyStepValues = Array.from(dailyStepMap.values())
    let streak = 0
    const sortedDays = Array.from(dailyStepMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
    for (let index = sortedDays.length - 1; index >= 0; index -= 1) {
      if (sortedDays[index][1] > 0) {
        streak += 1
      } else {
        break
      }
    }

    const totalSteps = dailyStepValues.reduce((sum, steps) => sum + steps, 0)
    setWeekData(chart.length ? chart : [{ week: 'W1', adherence: 0, reflux: 0, water: 0 }])
    setMonthlyStepData(monthlyChart.length ? monthlyChart : [{ day: 'Start', steps: 0 }])
    setSummary({ meals: meals.length, exercise: exercise.length, symptoms: symptoms.length, records: (recordsRes.data ?? []).length })
    setStepSummary({
      total: totalSteps,
      average: dailyStepValues.length ? Math.round(totalSteps / dailyStepValues.length) : 0,
      best: dailyStepValues.length ? Math.max(...dailyStepValues) : 0,
      streak,
      walkDays: dailyStepValues.filter((steps) => steps > 0).length,
      monthLabel: monthInfo.monthLabel,
    })
  }

  const monthGoalPercent = useMemo(() => Math.min(100, Math.round((stepSummary.total / MONTHLY_STEP_GOAL) * 100)), [stepSummary.total])

  return (
    <Screen eyebrow={weekStart ? `Current week ${getCurrentWeek(weekStart)} of 12` : '12-week system'} title="Progress board" action={<ActionLink href="/weekly-review" label="Review" />}>
      <Panel>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Meals logged</p><p className="mt-2 text-2xl text-white">{summary.meals}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Exercise logs</p><p className="mt-2 text-2xl text-white">{summary.exercise}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Symptom days</p><p className="mt-2 text-2xl text-white">{summary.symptoms}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Medical records</p><p className="mt-2 text-2xl text-white">{summary.records}</p></div>
        </div>
      </Panel>
      <Panel>
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Monthly walking steps</p>
            <h3 className="mt-1 text-xl text-white">{stepSummary.monthLabel}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl text-white">{formatStepCount(stepSummary.total)}</p>
            <p className="text-xs text-slate-400">{monthGoalPercent}% of {formatStepCount(MONTHLY_STEP_GOAL)}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Average day</p><p className="mt-2 text-2xl text-white">{formatStepCount(stepSummary.average)}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Best day</p><p className="mt-2 text-2xl text-white">{formatStepCount(stepSummary.best)}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Walk days</p><p className="mt-2 text-2xl text-white">{stepSummary.walkDays}</p></div>
          <div className="rounded-[20px] border border-white/10 bg-black/15 p-3"><p className="text-xs uppercase tracking-[0.22em] text-slate-400">Streak</p><p className="mt-2 text-2xl text-white">{stepSummary.streak}</p></div>
        </div>
        <p className="mt-3 text-xs text-slate-400">Daily walk target reference: {formatStepCount(DAILY_STEP_GOAL)} steps.</p>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Monthly step trend</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyStepData}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="#71827b" tickLine={false} axisLine={false} minTickGap={20} />
              <YAxis stroke="#71827b" tickLine={false} axisLine={false} width={36} />
              <Tooltip contentStyle={{ background: '#101917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }} />
              <Bar dataKey="steps" fill="#8dc4ff" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Supplement adherence by week</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekData}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="week" stroke="#71827b" tickLine={false} axisLine={false} />
              <YAxis stroke="#71827b" tickLine={false} axisLine={false} width={28} />
              <Tooltip contentStyle={{ background: '#101917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }} />
              <Bar dataKey="adherence" fill="#78d6b1" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
      <Panel>
        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reflux and hydration</p>
        <div className="mt-4 h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekData}>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="week" stroke="#71827b" tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#71827b" tickLine={false} axisLine={false} width={28} />
              <YAxis yAxisId="right" orientation="right" stroke="#71827b" tickLine={false} axisLine={false} width={38} />
              <Tooltip contentStyle={{ background: '#101917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }} />
              <Line yAxisId="left" type="monotone" dataKey="reflux" stroke="#ff8a7a" strokeWidth={3} dot={{ r: 3 }} />
              <Line yAxisId="right" type="monotone" dataKey="water" stroke="#8dc4ff" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </Screen>
  )
}
