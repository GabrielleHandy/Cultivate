import { AiModelEndpoints, ClothingItem, WearItSuggestion } from "@/constants/types"
import { getTrainingExamples, incrementUsage, isUnderCap, saveTrainingExample } from "./storage"

const AI_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY
const BONSAI_URL: string = process.env.EXPO_PUBLIC_BONSAI_URL || ''
const REQUIRED_CATEGORIES = ['Tops', 'Bottoms', 'Shoes']

//User specific model in later versions
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

  const underCap = await isUnderCap()
  if (underCap) {
    try {
      await incrementUsage()
      return await getOutfitSuggestion(items, context)
    } catch (error) {
      console.warn('Claude failed, falling back to Bonsai', error)
      return askBonsai(items, context)
    }
  } else {
    return askBonsai(items, context)
  }
}

export async function getOutfitSuggestion(items: ClothingItem[], context?: string): Promise<WearItSuggestion> {
  const errorAnswer = { suggestion: 'Could not generate a suggestion right now.', reason: "" }

  const wardrobeList = items
    .map(item => `- ${item.name} (${item.category})`)
    .join('\n')

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
          Be specific — name the actual items. Return your answer in this Json format. { suggestion: string, reason: string }. Keep reason and suggestion 2-3 sentences each.
          Never suggest items not in the wardrobe.`,
        messages: [{
          role: 'user',
          content: `Here is my wardrobe: ${wardrobeList}.${context ? ` Occasion: ${context}.` : ''} Suggest one complete outfit for today. If there is an Occasion make that the main context when suggesting.`
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

export async function askBonsai(items: ClothingItem[], context?: string): Promise<WearItSuggestion> {
  const examples = await getTrainingExamples()
const fewShotBlock = examples.length > 0
  ? `\nHere are examples of good outfit suggestions:\n` +
    examples.slice(-3).map(e =>
      `Wardrobe: ${e.wardrobeList}\nContext: ${e.context}\nGood suggestion: ${e.suggestion}`
    ).join('\n\n')
  : ''
  const wardrobeList = items
    .map(item => {
      let line = `- ${item.name} (${item.category})`
      if (item.color) line += `, color: ${item.color}`
      if (item.worn && item.worn > 0) line += `, worn ${item.worn} times`
      return line
    })
    .join('\n')

  const rules = `You are a fashion assistant. RULES:
1. Only use items from this wardrobe list. Never suggest anything else.
2. Pick exactly ONE outfit. No alternatives.
3. Plain sentences only. No bullets, no markdown.
4. Maximum 2 sentences.
5. Deliver suggestion like a warm, helpful stylist friend.
6. Do not mention categories like (Tops) or (Bottoms) in your response.
7. Return your answer in this JSON format: { "suggestion": string, "reason": string }
8. Never suggest items not in the wardrobe.
9. Favor items worn more often — they are likely favorites.
${fewShotBlock}
Wardrobe:
${wardrobeList}

${context ? `Occasion/context: ${context}` : 'Occasion: casual everyday'}`

  try {
    const response = await fetch(BONSAI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'bonsai',
        messages: [{ role: 'user', content: rules }],
        max_tokens: 300,
        temperature: 0.5
      })
    })
    const data = await response.json()
    return parseResponse(data, true)


  } catch (error) {
    console.error("Unkown Bonsai Error:", error)
    return {
      suggestion: "Bonsai server not reachable. Make sure your laptop server is running.",
      reason: ''
    }
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
        reason: (parsed?.reason || `Suggestion made by ${bonsai ? 'Bonsai' : 'Claude'}`).replace(/\*\*/g, '').trim()
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
  errorAnswer.reason = !!data?.content[0]?.text ? data?.stop_details?.explanation || '' : ''

  return errorAnswer?.reason ? errorAnswer : parsedAnswer(data?.content[0]?.text)
}
