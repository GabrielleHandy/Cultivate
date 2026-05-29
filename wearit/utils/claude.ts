import { AiModelEndpoints, ClothingItem, GapAnalysisResult, SavedOutfit, WearItSuggestion, WishlistItem } from "@/constants/types"
import { incrementUsage, isUnderCap, loadSavedOutfits, saveTrainingExample } from "./storage"
import { askModelAdapter } from "./modelAdapter"
import * as FileSystem from 'expo-file-system/legacy'
import { type Theme } from "@/constants/theme"

const AI_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY
const REQUIRED_CATEGORIES = ['Tops', 'Bottoms', 'Shoes']

const model: keyof typeof AiModelEndpoints = 'Anthropic'

export async function askWearIt(items: ClothingItem[], context?: string): Promise<WearItSuggestion> {
  const hasRequiredCategories = REQUIRED_CATEGORIES.every(cat =>
    items.some(item => item.category === cat)
  )

  if (!hasRequiredCategories) {
    return {
      suggestion: "Add more variety to your wardrobe for outfit suggestions!",
      reason: "You need at least one Top, Bottom, and pair of Shoes for a complete outfit."
    }
  }

  // Load saved outfits to pass as context — helps Claude avoid repeating suggestions
  const savedOutfits = await loadSavedOutfits()

  // Tier 1: Claude API (while under monthly cap)
  const underCap = await isUnderCap()
  if (underCap) {
    try {
      const result = await getOutfitSuggestion(items, context, savedOutfits)
      // Only increment after a real suggestion — don't burn credits on error responses
      if (result.suggestion && !result.suggestion.includes('Could not')) {
        await incrementUsage()
      }
      return result
    } catch (error) {
      console.warn('Claude failed, trying model adapter', error)
    }
  }

  // Tier 2: User-configured model adapter (any OpenAI-compatible endpoint)
  const adapterResult = await askModelAdapter(items, context)
  if (adapterResult) return adapterResult

  // Tier 3: Graceful degradation
  return {
    suggestion: "You've used your free AI suggestions for this month.",
    reason: "Add a fallback model in Settings to keep getting suggestions, or check back next month for more Claude credits."
  }
}

export async function getOutfitSuggestion(items: ClothingItem[], context?: string, savedOutfits?: SavedOutfit[]): Promise<WearItSuggestion> {
  const errorAnswer = { suggestion: 'Could not generate a suggestion right now.', reason: "" }

  const wardrobeList = items
    .map(item => `- ${item.name} (${item.category})`)
    .join('\n')

  // Inject up to 5 most recent saved looks so Claude avoids repeating them
  const savedLooksBlock = savedOutfits && savedOutfits.length > 0
    ? `\n\nThe user has already saved these outfits — avoid repeating the same combinations:\n` +
      savedOutfits.slice(0, 5).map(o => {
        const date = new Date(o.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `- [${date}${o.occasion ? `, ${o.occasion}` : ''}]: ${o.suggestion.split('.')[0]}.`
      }).join('\n')
    : ''

  if (!AI_KEY) {
    errorAnswer.reason = `Missing ${model} key.`
    return errorAnswer
  }

  try {
    const response = await fetch(AiModelEndpoints[model], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_KEY!,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        system: `You are WearIt, a personal fashion AI.
          You only suggest outfits using items from the user's actual wardrobe.
          Be specific — name the actual items. Return your answer in this JSON format: { "suggestion": string, "reason": string, "items": [array of exact item names from the wardrobe you selected] }. Keep reason and suggestion 2-3 sentences each.
          The "items" array must contain the exact item names as they appear in the wardrobe list — do not paraphrase or rename them.
          Never suggest items not in the wardrobe.`,
        messages: [{
          role: 'user',
          content: `Here is my wardrobe:\n${wardrobeList}${savedLooksBlock}${context ? `\n\nOccasion: ${context}` : ''}\n\nSuggest one complete outfit for today. If there is an Occasion make that the main context when suggesting.`
        }]
      })
    })
    const data = await response.json()
    const result = parseResponse(data)
  if (result.suggestion && !result.suggestion.includes('Could not')) {
  await saveTrainingExample({
    wardrobeList,
    context: context || 'casual everyday',
    suggestion: result.suggestion,
    reason: result.reason,
    timestamp: new Date().toISOString()
  })
}
  return result
  } catch (error) {
    console.error("Unkown Claude Error:", error)
    errorAnswer.reason = 'Claude Error'
    return errorAnswer
  }
}

export async function tagClothingItem(photoUri: string): Promise<{
  name: string
  category: ClothingItem['category']
  color: string
}> {
  const fallback = { name: 'New Item', category: 'Tops' as ClothingItem['category'], color: '' }

  if (!AI_KEY) return fallback

  try {
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: 'base64',
    })

    const ext = photoUri.split('.').pop()?.toLowerCase()
    const mediaType = ext === 'png' ? 'image/png' : 'image/jpeg'

    const response = await fetch(AiModelEndpoints['Anthropic'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 128,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: base64 },
            },
            {
              type: 'text',
              text: `Identify this clothing item. Return ONLY valid JSON, no other text:
{"name": string, "category": "Tops"|"Bottoms"|"Shoes"|"Dresses"|"Outerwear"|"Accessories"|"Other", "color": string}
Name should be specific (e.g. "White Linen Shirt", "Dark Wash Jeans"). Color is the primary color.`,
            },
          ],
        }],
      }),
    })

    const data = await response.json()
    const text = data?.content?.[0]?.text
    if (!text) return fallback

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return {
      name: parsed.name || fallback.name,
      category: parsed.category || fallback.category,
      color: parsed.color || '',
    }
  } catch (e) {
    console.warn('Auto-tag failed, using defaults:', e)
    return fallback
  }
}

export async function analyzeGap(
  wishlistItem: WishlistItem,
  wardrobe: ClothingItem[]
): Promise<GapAnalysisResult> {
  const fallback: GapAnalysisResult = {
    matches: [],
    missing: [],
    summary: 'Could not analyze your wardrobe right now. Try again in a moment.',
  }

  if (!AI_KEY) return fallback

  const wardrobeList = wardrobe
    .map(item => `- ${item.name} (${item.category}${item.color ? `, ${item.color}` : ''})`)
    .join('\n')

  try {
    const response = await fetch(AiModelEndpoints['Anthropic'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 512,
        system: `You are a personal fashion stylist AI. Given a wishlist item and a wardrobe, identify what the user already owns that works with or is similar to the wishlist item, and what they'd still need to complete the look. Be specific and practical. Return ONLY valid JSON — no markdown, no extra text.`,
        messages: [{
          role: 'user',
          content: `Wishlist item: ${wishlistItem.name} (${wishlistItem.color} ${wishlistItem.category})

My wardrobe:
${wardrobeList || 'No items yet'}

Return JSON in this exact format:
{
  "matchNames": ["exact item names from the wardrobe list that are similar to or would work well with this wishlist item"],
  "missing": ["short descriptions of pieces they'd need to complete a look — be specific, e.g. 'White sneakers', 'Slim-fit dark jeans'"],
  "summary": "2-3 sentences: what they already have that works, and what they still need"
}

Only include item names in matchNames that appear exactly in the wardrobe list above.`,
        }],
      }),
    })

    const data = await response.json()
    const text = data?.content?.[0]?.text
    if (!text) return fallback

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    // Map matchNames back to actual ClothingItem objects
    const matchNames: string[] = parsed.matchNames ?? []
    const matches = wardrobe.filter(item =>
      matchNames.some(name => name.toLowerCase() === item.name.toLowerCase())
    )

    return {
      matches,
      missing: Array.isArray(parsed.missing) ? parsed.missing : [],
      summary: parsed.summary ?? fallback.summary,
    }
  } catch (e) {
    console.warn('Gap analysis failed:', e)
    return fallback
  }
}

export async function generateTheme(aesthetic: string): Promise<Theme | null> {
  if (!AI_KEY) return null

  const themeContract = `
  background     — main screen background
  surface        — card / input background
  surfaceTint    — selected / hover state surface
  textPrimary    — headings, body text
  textSecondary  — labels, captions, muted text
  textPlaceholder — input placeholder text
  textOnAccent   — text on accent-colored backgrounds (must be readable)
  accent         — primary CTA, active tab, selection ring
  accentMuted    — secondary / outline states
  accentDanger   — destructive actions, errors
  border         — card and input borders
  borderSubtle   — dividers, very light separators
  tabActive      — active tab icon/text color
  tabInactive    — inactive tab icon/text color
  tabBar         — tab bar background
  tabBarBorder   — tab bar top border
  sectionLabel   — ALL CAPS section header labels`

  try {
    const response = await fetch(AiModelEndpoints['Anthropic'], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': AI_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 600,
        system: `You are a designer who creates mobile app color themes. Given an aesthetic description, generate a complete, harmonious color palette. Use hex colors only. Return ONLY a valid JSON object — no markdown, no explanation, no extra text.`,
        messages: [{
          role: 'user',
          content: `Create a WearIt app theme for the aesthetic: "${aesthetic}"

Return a JSON object with exactly these keys:
${themeContract}

Design rules:
- Hex colors only (e.g. "#1a1a2e")
- background and surface should feel immersive but not overwhelming — dark for moody aesthetics, light for airy ones
- accent is the personality color — make it feel true to the aesthetic
- textOnAccent must be readable on the accent background (white or near-black)
- border: "rgba(r,g,b,0.10)" style is fine for subtle borders
- tabBar should match or be very close to background
- sectionLabel should match accent
- Make it cohesive, beautiful, and unmistakably "${aesthetic}"`
        }]
      })
    })

    const data = await response.json()
    const text = data?.content?.[0]?.text
    if (!text) return null

    const cleaned = text
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const parsed = JSON.parse(cleaned)

    // Validate all required keys are present
    const required: (keyof Theme)[] = [
      'background', 'surface', 'surfaceTint', 'textPrimary', 'textSecondary',
      'textPlaceholder', 'textOnAccent', 'accent', 'accentMuted', 'accentDanger',
      'border', 'borderSubtle', 'tabActive', 'tabInactive', 'tabBar', 'tabBarBorder',
      'sectionLabel'
    ]
    const isValid = required.every(k => typeof parsed[k] === 'string')
    if (!isValid) return null

    return parsed as Theme
  } catch (e) {
    console.warn('Theme generation failed:', e)
    return null
  }
}

function parseResponse(data: any, bonsai?: boolean) {
  const errorAnswer = { suggestion: 'Could not generate a suggestion right now.', reason: "" }
  const parsedAnswer = (answer: any): WearItSuggestion => {
    if (!answer) return errorAnswer

    // Strip think tags
    const stripped = answer.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

    try {
      // Fix newlines inside JSON strings before parsing
      const sanitized = stripped
        .replace(/:\s*"([^"]*)\n([^"]*)"/g, ': "$1 $2"')  // flatten newlines in values
        .replace(/[\u0000-\u001F]/g, ' ')                   // remove control chars
        .replace(/,\s*}/g, '}')                             // trailing commas
        .replace(/}\s*$/, '}')
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')                              // ensure closing brace

      const parsed = JSON.parse(sanitized)
      return {
        suggestion: (parsed?.suggestion || '').replace(/\*\*/g, '').trim(),
        reason: (parsed?.reason || `Suggestion made by ${bonsai ? 'Bonsai' : 'Claude'}`).replace(/\*\*/g, '').trim(),
        itemNames: Array.isArray(parsed?.items) ? parsed.items : undefined,
      }
    } catch {
      // JSON failed — just use the raw text as suggestion
      return {
        suggestion: stripped.replace(/[{}"]/g, '').replace(/suggestion:|reason:/gi, '').trim(),
        reason: ''
      }
    }
  }
  if (data?.error) {
    console.error("Claude Error:", data.error)
    errorAnswer.reason = data.error.message
    return errorAnswer
  }
  if (bonsai) {
    let bonsaiAnswer = data?.choices?.[0]?.message?.content || null
    const answer = bonsaiAnswer?.replace(/<think>[\s\S]*?<\/think>/g, '').trim() || null
    return parsedAnswer(answer)
  }
  errorAnswer.reason = !!data?.content?.[0]?.text ? data?.stop_details?.explanation || '' : ''

  return errorAnswer?.reason ? errorAnswer : parsedAnswer(data?.content?.[0]?.text)
}
