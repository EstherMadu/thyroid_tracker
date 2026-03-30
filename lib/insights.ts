import type { ExerciseLog, Meal, SupplementLog, Symptom, WaterLog } from './supabase'

export type InsightType = 'warning' | 'good' | 'info' | 'alert'

export interface Insight {
  id: string
  type: InsightType
  title: string
  message: string
  priority: number
}

interface InsightData {
  meals: Meal[]
  supplements: SupplementLog[]
  symptoms: Symptom[]
  exercise: ExerciseLog[]
  water: WaterLog[]
  prevWeekSymptoms?: Symptom[]
}

function average(values: number[]) {
  if (!values.length) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function averageSymptom(symptoms: Symptom[]) {
  return average(
    symptoms
      .map((entry) => [
        entry.neck_pressure,
        entry.swallowing_pain,
        entry.singing_pain,
        entry.reflux,
        entry.throat_tightness,
        entry.fatigue,
        entry.pulse_awareness,
        entry.bloating,
      ])
      .flat()
      .filter((value): value is number => typeof value === 'number')
  )
}

export function computeInsights(data: InsightData): Insight[] {
  const insights: Insight[] = []
  const mealFlags = new Map<string, number>()
  const exerciseDates = new Set(data.exercise.map((entry) => entry.date))
  const dailyStepMap = new Map<string, number>()

  for (const log of data.exercise) {
    dailyStepMap.set(log.date, (dailyStepMap.get(log.date) ?? 0) + (log.step_count ?? 0))
  }

  for (const meal of data.meals) {
    const hasReaction = meal.flags?.reflux || meal.flags?.pressure || meal.flags?.bloating
    if (hasReaction) {
      mealFlags.set(meal.food_name, (mealFlags.get(meal.food_name) ?? 0) + 1)
    }
  }

  const repeatedTriggers = Array.from(mealFlags.entries()).filter(([, count]) => count >= 2)
  for (const [food, count] of repeatedTriggers) {
    insights.push({
      id: `trigger-${food}`,
      type: 'warning',
      title: `Repeated trigger: ${food}`,
      message: `${food} has been linked with discomfort ${count} times. Consider pulling it back for a week and reviewing symptoms.`,
      priority: 2,
    })
  }

  const lateDinnerReflux = data.meals.filter((meal) => {
    if (meal.meal_type !== 'dinner' || !meal.logged_at) return false
    return new Date(meal.logged_at).getHours() >= 20 && meal.flags?.reflux
  })
  if (lateDinnerReflux.length >= 1) {
    insights.push({
      id: 'late-dinner-reflux',
      type: 'alert',
      title: 'Late dinner may be worsening reflux',
      message: `${lateDinnerReflux.length} late dinner log(s) were marked with reflux. Moving dinner earlier and keeping it lighter may help.`,
      priority: 1,
    })
  }

  const defaultSuppNames = new Set(['Spirulina', 'Curcumin', 'Boswellia', 'Selenium', 'Zinc', 'Vitamin D'])
  const trackedDays = Array.from(new Set(data.supplements.map((entry) => entry.date))).length
  const takenCount = data.supplements.filter((entry) => entry.taken && defaultSuppNames.has(entry.name)).length
  const adherence = trackedDays ? (takenCount / (trackedDays * defaultSuppNames.size)) * 100 : 100
  if (trackedDays >= 3 && adherence < 70) {
    insights.push({
      id: 'supplement-adherence',
      type: 'alert',
      title: 'Supplement consistency is slipping',
      message: `Adherence is ${Math.round(adherence)}% this week. A simple morning or dinner reminder card could tighten the habit.`,
      priority: 1,
    })
  }

  const symptomAverage = averageSymptom(data.symptoms)
  const previousAverage = averageSymptom(data.prevWeekSymptoms ?? [])
  if (previousAverage && symptomAverage - previousAverage >= 1) {
    insights.push({
      id: 'symptom-trend',
      type: 'alert',
      title: 'Symptoms are trending upward',
      message: `Average symptom load has risen from ${previousAverage.toFixed(1)} to ${symptomAverage.toFixed(1)} week over week. Review food timing, reflux, and follow-up plans.`,
      priority: 1,
    })
  }

  const exerciseFatigue = data.symptoms.filter((entry) => typeof entry.fatigue === 'number')
  const fatigueOnExerciseDays = average(
    exerciseFatigue.filter((entry) => exerciseDates.has(entry.date)).map((entry) => entry.fatigue as number)
  )
  const fatigueOnRestDays = average(
    exerciseFatigue.filter((entry) => !exerciseDates.has(entry.date)).map((entry) => entry.fatigue as number)
  )
  if (fatigueOnExerciseDays && fatigueOnRestDays && fatigueOnExerciseDays + 0.5 < fatigueOnRestDays) {
    insights.push({
      id: 'exercise-pattern',
      type: 'good',
      title: 'Evening movement looks helpful',
      message: `Fatigue averages ${fatigueOnExerciseDays.toFixed(1)} on movement days versus ${fatigueOnRestDays.toFixed(1)} on rest days. Keep the sessions gentle and repeatable.`,
      priority: 4,
    })
  }

  const highStepDays = Array.from(dailyStepMap.entries()).filter(([, steps]) => steps >= 4000).map(([date]) => date)
  const lowStepDays = Array.from(dailyStepMap.entries()).filter(([, steps]) => steps > 0 && steps < 4000).map(([date]) => date)
  const fatigueHighStepDays = average(
    data.symptoms.filter((entry) => highStepDays.includes(entry.date) && typeof entry.fatigue === 'number').map((entry) => entry.fatigue as number)
  )
  const fatigueLowStepDays = average(
    data.symptoms.filter((entry) => lowStepDays.includes(entry.date) && typeof entry.fatigue === 'number').map((entry) => entry.fatigue as number)
  )
  if (fatigueHighStepDays && fatigueLowStepDays && fatigueHighStepDays + 0.5 < fatigueLowStepDays) {
    insights.push({
      id: 'step-pattern',
      type: 'good',
      title: 'Higher-step days look steadier',
      message: `On days you reached 4,000+ steps, fatigue averaged ${fatigueHighStepDays.toFixed(1)} versus ${fatigueLowStepDays.toFixed(1)} on lighter-step days.`,
      priority: 4,
    })
  }

  const lateMeals = data.meals.filter((meal) => meal.logged_at && new Date(meal.logged_at).getHours() >= 20)
  if (lateMeals.length >= 3) {
    insights.push({
      id: 'late-meal-pattern',
      type: 'warning',
      title: 'Late meal pattern detected',
      message: `${lateMeals.length} meals landed after 8pm this week. Earlier dinner timing may improve reflux, sleep, and overnight throat comfort.`,
      priority: 2,
    })
  }

  const avoidFoods = data.meals.filter((meal) => meal.food_status === 'avoid')
  if (avoidFoods.length) {
    const avoidNames = Array.from(new Set(avoidFoods.map((meal) => meal.food_name))).join(', ')
    insights.push({
      id: 'avoid-foods',
      type: 'warning',
      title: 'Avoid-list foods were logged',
      message: `Logged avoid foods: ${avoidNames}. That does not erase progress, but it is worth reviewing symptoms after those meals.`,
      priority: 2,
    })
  }

  const avgWater = average(data.water.map((entry) => entry.ml_total ?? entry.glasses * 300))
  if (data.water.length >= 3 && avgWater < 1800) {
    insights.push({
      id: 'water',
      type: 'info',
      title: 'Hydration is under target',
      message: `Average intake is about ${Math.round(avgWater)} ml per day. Pushing water earlier in the day may help energy, reflux, and routine stability.`,
      priority: 3,
    })
  }

  if (!insights.length) {
    insights.push({
      id: 'steady',
      type: 'good',
      title: 'Command center is gathering signal',
      message: 'Keep logging the five daily actions. A few more days of consistent entries will strengthen the pattern detection.',
      priority: 5,
    })
  }

  return insights.sort((a, b) => a.priority - b.priority)
}
