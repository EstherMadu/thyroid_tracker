'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ActionLink, MiniStat, Panel, Pill, Screen } from '@/components/AppShell'
import {
  DAILY_STEP_GOAL,
  DEFAULT_SUPPLEMENTS,
  MEAL_TYPES,
  MONTHLY_STEP_GOAL,
  REMINDER_CARDS,
  SYMPTOM_FIELDS,
  WATER_GOAL_ML,
  ExerciseLog,
  Meal,
  SupplementLog,
  Symptom,
  WaterLog,
  formatDate,
  formatStepCount,
  formatTime,
  getCurrentWeek,
  greeting,
  scoreTone,
  supabase,
  today,
} from '@/lib/supabase'
import { computeInsights } from '@/lib/insights'

const quickLinks = [
  { href: '/meals', label: 'Log meal' },
  { href: '/supplements', label: 'Supplements' },
  { href: '/symptoms', label: 'Score symptoms' },
  { href: '/water', label: 'Water' },
  { href: '/exercise', label: 'Evening movement' },
]

function monthStartFor(dateString: string) {
  const date = new Date(`${dateString}T00:00:00`)
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
}

export default function DashboardPage() {
  const [weekStart, setWeekStart] = useState<string>('')
  const [weekStartInput, setWeekStartInput] = useState('')
  const [meals, setMeals] = useState<Meal[]>([])
  const [supplements, setSupplements] = useState<SupplementLog[]>([])
  const [symptom, setSymptom] = useState<Symptom | null>(null)
  const [exercise, setExercise] = useState<ExerciseLog[]>([])
  const [water, setWater] = useState<WaterLog | null>(null)
  const [monthSteps, setMonthSteps] = useState(0)
  const [insightCard, setInsightCard] = useState<{ title: string; message: string; type: string } | null>(null)
  const [trendData, setTrendData] = useState<{ day: string; reflux: number; fatigue: number }[]>([])
  const [notifications, setNotifications] = useState<'idle' | 'granted' | 'denied'>('idle')
  const date = today()

  useEffect(() => {
    const storedWeekStart = localStorage.getItem('thyroid-week-start') ?? ''
    const notificationState = typeof Notification === 'undefined' ? 'denied' : Notification.permission === 'granted' ? 'granted' : Notification.permission === 'denied' ? 'denied' : 'idle'
    setNotifications(notificationState)
    setWeekStart(storedWeekStart)
    setWeekStartInput(storedWeekStart)
    void load(storedWeekStart)
  }, [])

  async function load(localWeekStart: string) {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    const since = sevenDaysAgo.toISOString().split('T')[0]
    const monthStart = monthStartFor(date)

    const [settingsRes, mealsRes, supplementsRes, symptomRes, exerciseRes, waterRes, monthlyExerciseRes, weeklyMeals, weeklySupps, weeklySymptoms, weeklyExercise, weeklyWater, previousSymptomsRes] = await Promise.all([
      supabase.from('app_settings').select('*').eq('key', 'week_start_date').maybeSingle(),
      supabase.from('meals').select('*').eq('date', date).order('logged_at'),
      supabase.from('supplement_logs').select('*').eq('date', date),
      supabase.from('symptoms').select('*').eq('date', date).maybeSingle(),
      supabase.from('exercise_logs').select('*').eq('date', date).order('logged_at'),
      supabase.from('water_logs').select('*').eq('date', date).maybeSingle(),
      supabase.from('exercise_logs').select('*').gte('date', monthStart),
      supabase.from('meals').select('*').gte('date', since),
      supabase.from('supplement_logs').select('*').gte('date', since),
      supabase.from('symptoms').select('*').gte('date', since).order('date'),
      supabase.from('exercise_logs').select('*').gte('date', since),
      supabase.from('water_logs').select('*').gte('date', since),
      supabase.from('symptoms').select('*').lt('date', since).order('date', { ascending: false }).limit(7),
    ])

    const dbWeekStart = typeof settingsRes.data?.value === 'string' ? settingsRes.data.value : ''
    if (dbWeekStart && !localWeekStart) {
      localStorage.setItem('thyroid-week-start', dbWeekStart)
      setWeekStart(dbWeekStart)
      setWeekStartInput(dbWeekStart)
    }

    const todaySupplements = (supplementsRes.data as SupplementLog[] | null) ?? []
    const filledSupplements = DEFAULT_SUPPLEMENTS.map((item) => {
      const match = todaySupplements.find((entry) => entry.name === item.name)
      return (
        match ?? {
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

    setMeals((mealsRes.data as Meal[] | null) ?? [])
    setSupplements(filledSupplements)
    setSymptom((symptomRes.data as Symptom | null) ?? null)
    setExercise((exerciseRes.data as ExerciseLog[] | null) ?? [])
    setWater((waterRes.data as WaterLog | null) ?? null)
    setMonthSteps(((monthlyExerciseRes.data as ExerciseLog[] | null) ?? []).reduce((sum, entry) => sum + (entry.step_count ?? 0), 0))

    const weeklyInsights = computeInsights({
      meals: (weeklyMeals.data as Meal[] | null) ?? [],
      supplements: (weeklySupps.data as SupplementLog[] | null) ?? [],
      symptoms: (weeklySymptoms.data as Symptom[] | null) ?? [],
      exercise: (weeklyExercise.data as ExerciseLog[] | null) ?? [],
      water: (weeklyWater.data as WaterLog[] | null) ?? [],
      prevWeekSymptoms: (previousSymptomsRes.data as Symptom[] | null) ?? [],
    })
    setInsightCard(weeklyInsights[0] ?? null)

    const trendSource = ((weeklySymptoms.data as Symptom[] | null) ?? []).map((entry) => ({
      day: new Date(`${entry.date}T00:00:00`).toLocaleDateString('en-GB', { weekday: 'short' }),
      reflux: entry.reflux ?? 0,
      fatigue: entry.fatigue ?? 0,
    }))
    setTrendData(trendSource)
  }

  async function saveWeekStart() {
    if (!weekStartInput) return
    await supabase.from('app_settings').upsert({ key: 'week_start_date', value: weekStartInput }, { onConflict: 'key' })
    localStorage.setItem('thyroid-week-start', weekStartInput)
    setWeekStart(weekStartInput)
  }

  async function requestNotifications() {
    if (typeof Notification === 'undefined') return
    const permission = await Notification.requestPermission()
    setNotifications(permission === 'default' ? 'idle' : permission)
    if (permission === 'granted') {
      new Notification('Thyroid Tracker', {
        body: 'Daily cards are ready: meals, supplements, symptoms, water, movement, and step logging.',
      })
    }
  }

  const currentWeek = getCurrentWeek(weekStart)
  const waterValue = water?.ml_total ?? 0
  const takenCount = supplements.filter((entry) => entry.taken).length
  const symptomsLogged = symptom ? SYMPTOM_FIELDS.filter((field) => typeof symptom[field.key] === 'number').length : 0
  const todaySteps = exercise.reduce((sum, entry) => sum + (entry.step_count ?? 0), 0)

  const completion = useMemo(() => {
    let points = 0
    if (meals.length > 0) points += 1
    if (takenCount > 0) points += 1
    if (symptom) points += 1
    if (waterValue > 0) points += 1
    if (exercise.length > 0) points += 1
    return points
  }, [exercise.length, meals.length, symptom, takenCount, waterValue])

  return (
    <Screen eyebrow={formatDate(date)} title="Thyroid Tracker" action={<ActionLink href="/weekly-review" label={`Week ${currentWeek} of 12`} />}>
      <Panel className="overflow-hidden">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-mint">{greeting()}</p>
            <h2 className="mt-2 text-2xl text-white">Personal thyroid command center</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">Today only needs five actions: meals, supplements, symptoms, water, and evening movement.</p>
          </div>
          <div className="rounded-[22px] border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-right">
            <p className="text-[11px] uppercase tracking-[0.24em] text-emerald-200">Daily score</p>
            <p className="text-3xl font-semibold text-white">{completion}/5</p>
          </div>
        </div>
        {!weekStart && (
          <div className="mt-4 rounded-[20px] border border-amber-300/20 bg-amber-400/10 p-3">
            <p className="text-sm font-semibold text-amber-100">Set your 12-week start date</p>
            <div className="mt-3 flex items-center gap-2">
              <input type="date" value={weekStartInput} onChange={(event) => setWeekStartInput(event.target.value)} className="flex-1 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none" />
              <button onClick={saveWeekStart} className="rounded-2xl bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950">Save</button>
            </div>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Meals" value={meals.length} hint="logged" />
        <MiniStat label="Supplements" value={`${takenCount}/${DEFAULT_SUPPLEMENTS.length}`} hint="taken" />
        <MiniStat label="Water" value={`${waterValue} ml`} hint={`${Math.round((waterValue / WATER_GOAL_ML) * 100) || 0}% of goal`} />
        <MiniStat label="Steps" value={formatStepCount(todaySteps)} hint="today" />
      </div>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Monthly walk steps</p>
            <h3 className="mt-1 text-xl text-white">{formatStepCount(monthSteps)} this month</h3>
          </div>
          <Pill className="border-emerald-300/20 bg-emerald-500/10 text-emerald-100">{Math.round((monthSteps / MONTHLY_STEP_GOAL) * 100) || 0}% goal</Pill>
        </div>
        <div className="mt-4 h-3 rounded-full bg-white/10">
          <div className="h-3 rounded-full bg-gradient-to-r from-emerald-400 to-sky-400" style={{ width: `${Math.min(100, Math.round((monthSteps / MONTHLY_STEP_GOAL) * 100))}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-300">Daily reference: {formatStepCount(DAILY_STEP_GOAL)} steps. Monthly target: {formatStepCount(MONTHLY_STEP_GOAL)} steps.</p>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Quick log</p>
            <h3 className="mt-1 text-xl text-white">Daily actions</h3>
          </div>
          <ActionLink href="/more" label="All tools" />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          {quickLinks.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-[20px] border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-slate-100">{item.label}</Link>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Reminder cards</p>
            <h3 className="mt-1 text-xl text-white">Keep the routine practical</h3>
          </div>
          <button onClick={requestNotifications} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            {notifications === 'granted' ? 'Notifications on' : 'Enable alerts'}
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {REMINDER_CARDS.map((card) => (
            <div key={card} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/15 px-3 py-3">
              <p className="text-sm text-slate-200">{card}</p>
              <span className="text-[11px] uppercase tracking-[0.24em] text-mint">today</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-400">Optional email reminders can be handled by Vercel cron endpoints once your delivery provider is added.</p>
      </Panel>

      {insightCard && (
        <Panel>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Rule-based insight</p>
              <h3 className="mt-1 text-xl text-white">{insightCard.title}</h3>
            </div>
            <Pill className="border-white/10 bg-white/5 text-slate-200">{insightCard.type}</Pill>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{insightCard.message}</p>
          <div className="mt-4 h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="day" stroke="#6d7e79" tickLine={false} axisLine={false} />
                <YAxis stroke="#6d7e79" tickLine={false} axisLine={false} width={26} />
                <Tooltip contentStyle={{ background: '#101917', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18 }} />
                <Line type="monotone" dataKey="reflux" stroke="#ff8a7a" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="fatigue" stroke="#78d6b1" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      )}

      <Panel>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Today</p>
            <h3 className="mt-1 text-xl text-white">Meal board</h3>
          </div>
          <ActionLink href="/meals" label="Open" />
        </div>
        <div className="mt-4 space-y-3">
          {meals.length === 0 && <p className="text-sm text-slate-400">No meals logged yet.</p>}
          {MEAL_TYPES.map((mealType) => {
            const entry = meals.find((meal) => meal.meal_type === mealType)
            return (
              <div key={mealType} className="rounded-[18px] border border-white/10 bg-black/15 px-3 py-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">{mealType}</p>
                  {entry?.food_status && <Pill className={entry.food_status === 'safe' ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : entry.food_status === 'caution' ? 'border-amber-300/20 bg-amber-500/10 text-amber-100' : 'border-rose-300/20 bg-rose-500/10 text-rose-100'}>{entry.food_status}</Pill>}
                </div>
                <p className="mt-1 text-sm text-white">{entry?.food_name ?? 'Nothing logged'}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                  <span>{entry?.portion_size ?? 'portion pending'}</span>
                  <span>{entry?.logged_at ? formatTime(entry.logged_at) : '--'}</span>
                  {(entry?.flags?.reflux || entry?.flags?.pressure || entry?.flags?.bloating) && <span>flagged</span>}
                </div>
              </div>
            )
          })}
        </div>
      </Panel>

      <div className="grid grid-cols-1 gap-4">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Supplements</p>
              <h3 className="mt-1 text-xl text-white">Today&apos;s adherence</h3>
            </div>
            <ActionLink href="/supplements" label="Update" />
          </div>
          <div className="mt-4 space-y-2">
            {supplements.map((entry) => (
              <div key={entry.name} className="flex items-center justify-between rounded-[18px] border border-white/10 bg-black/15 px-3 py-3">
                <div>
                  <p className="text-sm text-white">{entry.name}</p>
                  <p className="text-xs text-slate-400">{DEFAULT_SUPPLEMENTS.find((item) => item.name === entry.name)?.dosage ?? 'custom'}</p>
                </div>
                <Pill className={entry.taken ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/5 text-slate-300'}>{entry.taken ? 'taken' : 'pending'}</Pill>
              </div>
            ))}
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Symptoms</p>
              <h3 className="mt-1 text-xl text-white">Daily snapshot</h3>
            </div>
            <ActionLink href="/symptoms" label="Score" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {SYMPTOM_FIELDS.map((field) => {
              const value = symptom?.[field.key]
              const tone = typeof value === 'number' ? scoreTone(value, field.direction) : 'okay'
              return (
                <div key={field.key} className="rounded-[18px] border border-white/10 bg-black/15 p-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{field.label}</p>
                  <p className={`mt-2 text-2xl font-semibold ${tone === 'good' ? 'text-emerald-200' : tone === 'okay' ? 'text-amber-100' : 'text-rose-200'}`}>{typeof value === 'number' ? value : '--'}</p>
                </div>
              )
            })}
          </div>
          <p className="mt-3 text-xs text-slate-400">{symptomsLogged ? `${symptomsLogged} symptom fields logged today.` : 'No symptom score saved today yet.'}</p>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Hydration</p>
              <h3 className="mt-1 text-xl text-white">Water intake</h3>
            </div>
            <ActionLink href="/water" label="Log" />
          </div>
          <div className="mt-4 h-3 rounded-full bg-white/10">
            <div className="h-3 rounded-full bg-gradient-to-r from-sky-400 to-mint" style={{ width: `${Math.min(100, Math.round((waterValue / WATER_GOAL_ML) * 100))}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-300">{waterValue} ml logged of {WATER_GOAL_ML} ml target.</p>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Evening exercise</p>
              <h3 className="mt-1 text-xl text-white">Movement reminder</h3>
            </div>
            <ActionLink href="/exercise" label="Open" />
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300">{exercise.length ? `Logged ${exercise.length} movement session(s) today and ${formatStepCount(todaySteps)} walk steps.` : 'No movement logged yet. A walk, stretch, breathing, or gentle yoga still counts.'}</p>
        </Panel>
      </div>
    </Screen>
  )
}

