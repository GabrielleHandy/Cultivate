import { ClothingItem } from '@/constants/types'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'


//MONTHLY CAP LOGIC
const USAGE_KEY = 'wearit_claude_usage'
const MONTHLY_CAP = 20
export async function getUsageCount(): Promise<number> {
  const raw = await AsyncStorage.getItem(USAGE_KEY)
  if (!raw) return 0
  const parsed = JSON.parse(raw)
  
  // Reset if it's a new month
  const now = new Date()
  if (parsed.month !== now.getMonth()) {
    await AsyncStorage.removeItem(USAGE_KEY)
    return 0
  }
  
  return parsed.count
}

export async function incrementUsage(): Promise<void> {
  const count = await getUsageCount()
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify({
    count: count + 1,
    month: new Date().getMonth()
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