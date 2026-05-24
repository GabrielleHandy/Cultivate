import { askWearIt } from "./claude"

const mockItems = [
  { id:'1', name:'White Tee', category:'Tops', emoji:'👕', addedAt:'2026-01-01', worn:3 },
  { id:'2', name:'Black Jeans', category:'Bottoms', emoji:'👖', addedAt:'2026-01-01', worn:5 },
  { id:'3', name:'Sneakers', category:'Shoes', emoji:'👟', addedAt:'2026-01-01', worn:4 },
]

function checkShape(result: any): boolean {
    return ( result &&
    typeof result === 'object' &&
    result !== null &&
    typeof result.suggestion === 'string' &&
    typeof result.reason === 'string'
  )
}

async function testHappyPath() {
  let response = await askWearIt(mockItems as any)
  console.log(`Scenario: ${"Happy Path"}`)
  console.log(`Pass: ${checkShape(response)}`)
  console.log(`Response: ${JSON.stringify(response)}`)

}

async function testClaudeFails() {
   const originalFetch = global.fetch
  global.fetch = async (input: RequestInfo | URL, ...args: any[]) => {
    if (input.toString().includes('anthropic')) throw new Error('Simulated Claude failure')
    return originalFetch(input, ...args)
  }

  const response = await askWearIt(mockItems as any)
  console.log(`Scenario: Claude Fails`)
  console.log(`Pass: ${checkShape(response)}`)
  console.log(`Response: ${JSON.stringify(response)}`)

  global.fetch = originalFetch
  
}

async function testBothFail() {
  const originalFetch = global.fetch
  global.fetch = async (input: RequestInfo | URL, ...args: any[]) => {
    if (input.toString().includes('anthropic') || input.toString().includes('bonsai')) throw new Error('Simulated total failure')
    return originalFetch(input, ...args)
  }

  const response = await askWearIt(mockItems as any)
  console.log(`Scenario: Both Fail`)
  console.log(`Pass: ${checkShape(response)}`)
  console.log(`Response: ${JSON.stringify(response)}`)

  global.fetch = originalFetch
}

export async function testFallbackChain() {
  await testHappyPath()
  await testClaudeFails()
  await testBothFail()
}