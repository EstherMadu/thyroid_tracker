import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : (null as unknown as ReturnType<typeof createClient>)

export const PROGRAM_WEEKS = 12
export const WATER_GOAL_ML = 2400
export const WATER_STEP_ML = 250
export const MONTHLY_STEP_GOAL = 120000
export const DAILY_STEP_GOAL = 4000
export const DEFAULT_SUPPLEMENTS = [
  { name: 'Spirulina', dosage: '2000 mg', kind: 'core' },
  { name: 'Curcumin', dosage: '500 mg', kind: 'core' },
  { name: 'Boswellia', dosage: '400 mg', kind: 'core' },
  { name: 'Selenium', dosage: '200 mcg', kind: 'core' },
  { name: 'Zinc', dosage: '25 mg', kind: 'core' },
  { name: 'Vitamin D', dosage: '2000 IU', kind: 'core' },
] as const

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const
export type MealType = (typeof MEAL_TYPES)[number]

export const FOOD_STATUSES = ['safe', 'caution', 'avoid'] as const
export type FoodStatus = (typeof FOOD_STATUSES)[number]

export const SYMPTOM_FIELDS = [
  { key: 'neck_pressure', label: 'Neck pressure', direction: 'lower' },
  { key: 'swallowing_pain', label: 'Swallowing pain', direction: 'lower' },
  { key: 'singing_pain', label: 'Pain when singing', direction: 'lower' },
  { key: 'reflux', label: 'Reflux or chest burn', direction: 'lower' },
  { key: 'throat_tightness', label: 'Throat tightness', direction: 'lower' },
  { key: 'fatigue', label: 'Fatigue', direction: 'lower' },
  { key: 'pulse_awareness', label: 'Pulse awareness', direction: 'lower' },
  { key: 'bloating', label: 'Bloating', direction: 'lower' },
  { key: 'sleep_quality', label: 'Sleep quality', direction: 'higher' },
] as const
export type SymptomKey = (typeof SYMPTOM_FIELDS)[number]['key']

export const EXERCISE_TYPES = ['Walk', 'Stretch', 'Low-impact exercise', 'Yoga', 'Breathing'] as const
export const INTENSITIES = ['low', 'medium', 'high'] as const

export interface Meal {
  id: string
  date: string
  meal_type: MealType
  food_name: string
  portion_size: string | null
  logged_at: string | null
  triggers: string[]
  flags: { reflux?: boolean; pressure?: boolean; bloating?: boolean } | null
  notes: string | null
  food_status: FoodStatus | null
  created_at: string
}

export interface SupplementLog {
  id: string
  date: string
  name: string
  taken: boolean
  dosage_mg: number | null
  time_taken: string | null
  created_at: string
}

export interface Symptom {
  id: string
  date: string
  neck_pressure: number | null
  swallowing_pain: number | null
  singing_pain: number | null
  reflux: number | null
  throat_tightness: number | null
  fatigue: number | null
  pulse_awareness: number | null
  bloating: number | null
  sleep_quality: number | null
  notes: string | null
  created_at: string
}

export interface ExerciseLog {
  id: string
  date: string
  exercise_type: string
  duration_minutes: number | null
  step_count: number | null
  intensity: 'low' | 'medium' | 'high' | null
  before_feeling: string | null
  after_feeling: string | null
  logged_at: string | null
  notes: string | null
  created_at: string
}

export interface WaterLog {
  id: string
  date: string
  glasses: number
  ml_total: number | null
  created_at: string
}

export interface JournalEntry {
  id: string
  date: string
  content: string
  mood: number | null
  created_at: string
}

export interface WeeklyReview {
  id: string
  week_number: number
  week_start_date: string
  overall_rating: number | null
  wins: string | null
  challenges: string | null
  goals_next_week: string | null
  trigger_foods: string | null
  notes: string | null
  created_at: string
}

export interface MedicalRecord {
  id: string
  file_name: string
  file_path: string
  file_type: string | null
  file_size: number | null
  record_type: string | null
  record_date: string | null
  notes: string | null
  created_at: string
}

export interface TriggerFood {
  id: string
  food_name: string
  notes: string | null
  added_date: string
  created_at: string
}

export interface FoodReference {
  name: string
  category: string
  status: FoodStatus
  note?: string
}

export const FOOD_REFERENCE: FoodReference[] = [
  { name: 'Eggs', category: 'Protein', status: 'safe' },
  { name: 'Fish', category: 'Protein', status: 'safe' },
  { name: 'Chicken', category: 'Protein', status: 'safe' },
  { name: 'Turkey', category: 'Protein', status: 'safe' },
  { name: 'Goat meat in light soup', category: 'Protein', status: 'safe' },
  { name: 'Moi moi', category: 'Protein', status: 'safe' },
  { name: 'Beef', category: 'Protein', status: 'caution' },
  { name: 'Goat meat', category: 'Protein', status: 'caution' },
  { name: 'Deep fried meats', category: 'Protein', status: 'avoid' },
  { name: 'Yam', category: 'Carbs', status: 'safe' },
  { name: 'Sweet potato', category: 'Carbs', status: 'safe' },
  { name: 'Plantain', category: 'Carbs', status: 'safe' },
  { name: 'Rice', category: 'Carbs', status: 'safe' },
  { name: 'Pap', category: 'Carbs', status: 'safe' },
  { name: 'Bread', category: 'Carbs', status: 'caution' },
  { name: 'Oats if irritating', category: 'Carbs', status: 'caution' },
  { name: 'Garri if heavy', category: 'Carbs', status: 'caution' },
  { name: 'Noodles if triggering', category: 'Carbs', status: 'avoid' },
  { name: 'Pastries', category: 'Carbs', status: 'avoid' },
  { name: 'Ugu', category: 'Vegetables', status: 'safe' },
  { name: 'Spinach', category: 'Vegetables', status: 'safe' },
  { name: 'Okra', category: 'Vegetables', status: 'safe' },
  { name: 'Bitterleaf', category: 'Vegetables', status: 'safe' },
  { name: 'Carrots', category: 'Vegetables', status: 'safe' },
  { name: 'Cucumber', category: 'Vegetables', status: 'safe' },
  { name: 'Green beans', category: 'Vegetables', status: 'safe' },
  { name: 'Garden eggs', category: 'Vegetables', status: 'safe' },
  { name: 'Lettuce if bloating', category: 'Vegetables', status: 'caution' },
  { name: 'Cabbage', category: 'Vegetables', status: 'avoid' },
  { name: 'Broccoli', category: 'Vegetables', status: 'avoid' },
  { name: 'Cauliflower', category: 'Vegetables', status: 'avoid' },
  { name: 'Banana', category: 'Fruits', status: 'safe' },
  { name: 'Apple', category: 'Fruits', status: 'safe' },
  { name: 'Pawpaw', category: 'Fruits', status: 'safe' },
  { name: 'Avocado', category: 'Fruits', status: 'safe' },
  { name: 'Coconut', category: 'Fruits', status: 'safe' },
  { name: 'Very sweet fruits in excess', category: 'Fruits', status: 'caution' },
  { name: 'Water', category: 'Drinks', status: 'safe' },
  { name: 'Warm water', category: 'Drinks', status: 'safe' },
  { name: 'Mild tea', category: 'Drinks', status: 'safe' },
  { name: 'Coffee', category: 'Drinks', status: 'caution' },
  { name: 'Sugary drinks', category: 'Drinks', status: 'caution' },
  { name: 'Alcohol', category: 'Drinks', status: 'avoid' },
  { name: 'Energy drinks', category: 'Drinks', status: 'avoid' },
  { name: 'Regular meals', category: 'Eating pattern', status: 'safe' },
  { name: 'Light dinner', category: 'Eating pattern', status: 'safe' },
  { name: 'Delayed meals', category: 'Eating pattern', status: 'caution' },
  { name: 'Late heavy dinner', category: 'Eating pattern', status: 'avoid' },
]

export const NIGERIAN_MEAL_LIBRARY = [
  'Boiled yam and eggs',
  'Pap and eggs',
  'Pap and moi moi',
  'White rice and fish stew',
  'Jollof rice and grilled chicken',
  'Ofada rice and turkey',
  'Boiled plantain and sauce',
  'Sweet potato and fish',
  'Moi moi and avocado',
  'Yam porridge',
  'Pepper soup with fish',
  'Okra soup with light swallow',
  'Ugu soup and rice',
  'Garden egg sauce and yam',
  'Catfish stew and rice',
  'Akara and pap',
  'Beans porridge',
  'Bread and egg',
  'Noodles and egg',
  'Fried rice',
]

export const REMINDER_CARDS = [
  'Log what you ate.',
  'Mark supplements taken.',
  'Score symptoms.',
  'Log water.',
  'Log evening movement.',
]

export function today() {
  return new Date().toISOString().split('T')[0]
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning check-in'
  if (hour < 17) return 'Afternoon check-in'
  return 'Evening check-in'
}

export function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function toDateTime(date: string, time: string | null | undefined) {
  if (!time) return null
  return `${date}T${time}:00`
}

export function formatTime(value: string | null | undefined) {
  if (!value) return '--'
  const date = new Date(value)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function formatStepCount(value: number | null | undefined) {
  return new Intl.NumberFormat('en-US').format(value ?? 0)
}

export function getCurrentWeek(startDate: string | null | undefined) {
  if (!startDate) return 1
  const start = new Date(`${startDate}T00:00:00`)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000)
  if (diffDays < 0) return 1
  return Math.min(PROGRAM_WEEKS, Math.floor(diffDays / 7) + 1)
}

export function getWeekStartDate(programStart: string, weekNumber: number) {
  const date = new Date(`${programStart}T00:00:00`)
  date.setDate(date.getDate() + (weekNumber - 1) * 7)
  return date.toISOString().split('T')[0]
}

export function getWeekDates(date = new Date()) {
  const end = new Date(date)
  const start = new Date(date)
  start.setDate(end.getDate() - 6)
  return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
}

export function scoreTone(value: number, direction: 'lower' | 'higher') {
  const adjusted = direction === 'higher' ? value : 10 - value
  if (adjusted >= 7) return 'good'
  if (adjusted >= 4) return 'okay'
  return 'alert'
}

export function statusClasses(status: FoodStatus | null | undefined) {
  if (status === 'safe') return 'bg-emerald-500/15 text-emerald-200 border-emerald-400/20'
  if (status === 'caution') return 'bg-amber-500/15 text-amber-100 border-amber-300/20'
  if (status === 'avoid') return 'bg-rose-500/15 text-rose-100 border-rose-300/20'
  return 'bg-white/5 text-slate-200 border-white/10'
}

export function getFoodReference(name: string) {
  const lower = name.toLowerCase()
  return FOOD_REFERENCE.find((item) => lower.includes(item.name.toLowerCase()))
}
