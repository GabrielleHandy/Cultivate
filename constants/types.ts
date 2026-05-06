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

export const ClothingCategoryOptions = [
  'Tops',
  'Bottoms',
  'Shoes',
  'Dresses',
  'Outerwear',
  'Accessories',
  'Other',]