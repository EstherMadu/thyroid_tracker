import { FOOD_REFERENCE, NIGERIAN_MEAL_LIBRARY, getFoodReference } from './supabase'

export type FoodStatus = 'safe' | 'caution' | 'avoid'

export interface FoodItem {
  id: string
  name: string
  category: string
  status: FoodStatus
  notes?: string
}

export const FOOD_LIBRARY: FoodItem[] = FOOD_REFERENCE.map((item) => ({
  id: item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  name: item.name,
  category: item.category,
  status: item.status,
  notes: item.note,
}))

export const NIGERIAN_MEALS = NIGERIAN_MEAL_LIBRARY

export function searchFoods(query: string) {
  const value = query.trim().toLowerCase()
  if (!value) return FOOD_LIBRARY
  return FOOD_LIBRARY.filter((food) =>
    [food.name, food.category, food.status, food.notes ?? ''].some((field) =>
      field.toLowerCase().includes(value)
    )
  )
}

export function getFoodsByStatus(status: FoodStatus) {
  return FOOD_LIBRARY.filter((food) => food.status === status)
}

export { getFoodReference as getFoodByName }

