# Context — Builder & Stack

## Builder

**Gabrielle (Gabby) Handy**
- Frontend engineer at CVS Health (day job)
- Building WearIt as portfolio project + real product
- Ideas come faster than time — needs help staying grounded and executing one thing at a time
- Currently dog-fooding EnvisionIt through Cowork sessions

## Stack

| Layer | Tech |
|-------|------|
| App framework | React Native + Expo |
| Routing | Expo Router (file-based, `app/(tabs)/`) |
| Language | TypeScript (strict, no `any`) |
| Persistence | AsyncStorage |
| AI (Tier 1) | Claude API — `claude-sonnet-4-5` |
| AI (Tier 2) | Any OpenAI-compatible endpoint (Ollama, Groq, OpenRouter) |
| Styling | StyleSheet.create — never inline styles |

## Working Style / Rules

1. One feature at a time — log ideas, don't start them
2. Check if a pattern already exists before building new
3. Fix known bugs before adding features that would interfere
4. Design system (`constants/theme.ts`) is source of truth — flag hardcoded colors
5. Default to action — after completing a task, move to next priority without asking
