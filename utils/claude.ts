import { ClothingCategoryOptions, ClothingItem } from "@/constants/types"

const ANTHROPIC_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY


export async function getOutfitSuggestion(items: ClothingItem[]): Promise<string> {
  const wardrobeList = items
    .map(item => `- ${item.name} (${item.category})`)
    .join('\n')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY!,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 512,
      system: `You are WearIt, a personal fashion AI. 
You only suggest outfits using items from the user's actual wardrobe.
Be specific — name the actual items. Keep it to 2-3 sentences.
Never suggest items not in the wardrobe.`,
      messages: [{
        role: 'user',
        content: `Here is my wardrobe:\n${wardrobeList}\n\nSuggest one complete outfit for today.`
      }]
    })
  })

  const data = await response.json()
  if (data.error) return 'Could not generate a suggestion right now.'
  return data.content[0].text
}
