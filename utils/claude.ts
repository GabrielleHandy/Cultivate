import { AiModelEndpoints, ClothingItem } from "@/constants/types"
import { incrementUsage, isUnderCap } from "./storage"

const AI_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_KEY
//User specific model in later versions
const model: keyof typeof AiModelEndpoints= 'Anthropic'
export async function askWearIt(items: ClothingItem[], userMessage?: string): Promise<string> {
  const underCap = await isUnderCap()

  if (underCap) {
    await incrementUsage()
    return await getOutfitSuggestion(items, userMessage)
  } else {
    return askBonsai(items, userMessage)
  }

}
export async function getOutfitSuggestion(items: ClothingItem[], message?: string): Promise<string> {
  const wardrobeList = items
    .map(item => `- ${item.name} (${item.category})`)
    .join('\n')
   if (!AI_KEY) return `Missing ${model} key.`

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
    Be specific — name the actual items. Keep it to 2-3 sentences.
    Never suggest items not in the wardrobe.`,
          messages: [{
            role: 'user',
            content: `Here is my wardrobe: ${wardrobeList}. Suggest one complete outfit for today.`
          }]
        })
      })
       const data = await response.json()
      return parseResponse(data)
   } catch (error) {
    console.error("Network Error:", error)
    return 'Could not generate a suggestion right now.'
   }
  

 
}
function askBonsai( items: ClothingItem[], message?: string): string {
  return "You've used your 20 monthly Claude suggestions! Bonsai AI coming in Module 5B — for now, trust your instincts. 👗"
}
function parseResponse(data:any){
  if(data?.error){
    return 'Could not generate a suggestion right now.'
  }
  return !!data?.content[0]?.text ? data.content[0].text : 'Could not generate a suggestion right now.'
}
