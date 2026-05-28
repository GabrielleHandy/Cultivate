export type ClothingItem = {
  id: string
  name: string
  category: 'Tops' | 'Bottoms' | 'Shoes' | 'Dresses' | 'Outerwear' | 'Accessories' | 'Other'
  emoji: string
  photoUri?: string        // camera photo — optional until Module 4
  color?: string           // for AI outfit matching later
  worn?: number            // track how often you wear it
  addedAt: string          // ISO date string
}
export type WearItSuggestion = {
  suggestion: string
  reason: string
  itemNames?: string[]   // exact wardrobe item names Claude selected for this outfit
}

export type WishlistItem = {
  id: string
  name: string
  category: ClothingItem['category']
  color: string
  photoUri: string       // always required — the visual is the point
  sourceNote?: string    // optional: "from Zara", "seen on TikTok", etc.
  addedAt: string
}

export type SavedOutfit = {
  id: string
  suggestion: string   // the full AI-generated outfit text
  reason: string       // Claude's reasoning
  occasion: string     // what the user typed ("date night", "interview", etc.)
  weather: string      // weather context at time of generation
  savedAt: string      // ISO date string
  itemIds?: string[]   // wardrobe item IDs in this outfit (for linking back to detail screens)
}

export type GapAnalysisResult = {
  matches: ClothingItem[]       // items you already own that are similar
  missing: string[]             // categories/pieces you'd need to complete the look
  summary: string               // Claude's plain-english read
}

export const ClothingCategoryOptions = [
  'Tops',
  'Bottoms',
  'Shoes',
  'Dresses',
  'Outerwear',
  'Accessories',
  'Other',]

export const AiModelEndpoints = {
  'Anthropic': 'https://api.anthropic.com/v1/messages'
}

export type ModelConfig = {
  url: string       // Any OpenAI-compatible endpoint
  model: string     // e.g. "llama3.2", "mistral", "gpt-4o-mini", "gemma3"
  apiKey?: string   // Optional — Ollama and local servers don't need one
  label?: string    // Display name shown in settings UI
}