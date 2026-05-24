import { ClothingItem } from '@/constants/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'


//MONTHLY CAP LOGIC
const USAGE_KEY = 'wearit_claude_usage'
const MONTHLY_CAP = 2
export async function getUsageCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(USAGE_KEY)
  if (!raw) return 0
  const parsed = JSON.parse(raw)

  // Reset if it's a new month or new year
  const now = new Date()
  if (parsed.month !== now.getMonth() || parsed.year !== now.getFullYear()) {
    await AsyncStorage.removeItem(USAGE_KEY)
    return 0
  }

  return parsed.count
}

export async function incrementUsage(): Promise<void> {
  const count = await getUsageCount()
  const now = new Date()
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({
    count: count + 1,
    month: now.getMonth(),
    year: now.getFullYear(),
  }))
}

export async function isUnderCap(): Promise<boolean> {
  const count = await getUsageCount()
  return count < MONTHLY_CAP
}

//WARDROBE LOGIC CRUD
const WARDROBE_KEY = 'wearit_wardrobe'

export async function loadWardrobe(): Promise<ClothingItem[]> {
  const raw = await AsyncStorage.getItem(WARDROBE_KEY)
  if (!raw) return []
  return JSON.parse(raw)
}

export async function saveWardrobe(items: ClothingItem[]) {
  await AsyncStorage.setItem(WARDROBE_KEY, JSON.stringify(items))
}

export async function addItem(item: Omit<ClothingItem, 'id'>) {
  const current = await loadWardrobe()
  const newItem = { ...item, id: Crypto.randomUUID() }
  await saveWardrobe([...current, newItem])
  return newItem
}

export async function deleteItem(id: string) {
  const current = await loadWardrobe()
  await saveWardrobe(current.filter(item => item.id !== id))
}

export async function updateItem(updated: ClothingItem) {
  const current = await loadWardrobe()
  await saveWardrobe(current.map(item =>
    item.id === updated.id ? updated : item
  ))
}

//TRAINING EXAMPLES

const TRAINING_KEY = 'wearit_training_examples'

export type TrainingExample = {
  wardrobeList: string
  context: string
  suggestion: string
  reason: string
  timestamp: string
}

export async function saveTrainingExample(example: TrainingExample): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(TRAINING_KEY)
    const existing: TrainingExample[] = raw ? JSON.parse(raw) : []
    // Keep last 20 examples — enough for few-shot, not too heavy
    const updated = [...existing, example].slice(-20)
    await AsyncStorage.setItem(TRAINING_KEY, JSON.stringify(updated))
  } catch(e) {
    console.error('Failed to save training example:', e)
  }
}

export async function getTrainingExamples(): Promise<TrainingExample[]> {
  try {
    const raw = await AsyncStorage.getItem(TRAINING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}