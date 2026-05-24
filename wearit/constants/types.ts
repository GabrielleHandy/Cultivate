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