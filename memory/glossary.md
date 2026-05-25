# Glossary — Terms, Acronyms & Shorthand

## Products / Codenames

| Name | What |
|------|------|
| **WearIt** | AI-powered wardrobe assistant. Live app. React Native + Expo. Portfolio piece + real product. |
| **Cultivate** | The parent ecosystem / AI bootcamp brand. WearIt is its first live app. |
| **LearnIt** | Next product — AI learning companion for builders. Closes "code that runs" vs "code I understand" gap. |
| **EnvisionIt** | After LearnIt — AI co-founder for early-stage builders. Turns vision → strategy → execution. |
| **The Cultivate Empire** | Gabby's product roadmap: WearIt → LearnIt → EnvisionIt |

## Technical Terms

| Term | Meaning |
|------|---------|
| **three-tier AI chain** | WearIt's outfit suggestion fallback: Claude API → user-configured OpenAI-compatible model → graceful degradation |
| **modelAdapter** | `utils/modelAdapter.ts` — universal OpenAI-compatible fallback adapter |
| **few-shot training** | Past Claude suggestions saved (last 20) and injected into Tier 2 prompts |
| **Tier 1 / Tier 2 / Tier 3** | Claude API / fallback model / graceful degradation (no model configured) |
| **useFocusEffect** | React Native hook used for data loading on screen focus |
| **AsyncStorage** | Persistence layer for all WearIt data (wardrobe, wishlist, usage, training, model config) |

## Design Tokens

| Token | Value |
|-------|-------|
| `WearItTheme.background` | `#FAF7F2` |
| `WearItTheme.accent` | `#C97B5A` |
| `WearItTheme.textPrimary` | `#2C1F1A` |
| `Spacing.screen` | 20 |
| `Radius.xl` | 16 |
