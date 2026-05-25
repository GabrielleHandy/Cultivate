# Project: WearIt

**Status:** Live  
**Type:** React Native + Expo  
**Vision:** "Modern MySpace for your closet" — users customize their WearIt aesthetic

## Live Features

- Wardrobe CRUD (add via camera or photo library, Claude auto-tags name/category/color)
- Outfit suggestions (three-tier AI chain)
- Wishlist (save items you want)
- Shopping tab (in progress)
- Settings tab (configure fallback AI model)

## In Progress

- AI model pill on Outfits screen (replace settings tab with contextual in-screen switcher)

## Known Bugs (as of May 2026)

| Bug | File | Issue |
|-----|------|-------|
| Race condition | `saveImagePermanently` | `copy()` not awaited |
| Usage counter timing | `utils/claude.ts` area | Increments before Claude success confirmed |
| Hardcoded location | `utils/weather.ts` | Winston-Salem hardcoded; should use device GPS |
| Dead file | `testFallback.ts` | Imported nowhere — delete it |

## Key Files

| File | Purpose |
|------|---------|
| `app/(tabs)/wardrobe.tsx` | Wardrobe grid, camera/library add |
| `app/(tabs)/outfits.tsx` | AI outfit suggestion screen |
| `app/(tabs)/shopping.tsx` | Wishlist / shopping |
| `app/(tabs)/settings.tsx` | AI model configuration |
| `constants/theme.ts` | ALL design tokens — source of truth |
| `constants/types.ts` | TypeScript types + AiModelEndpoints |
| `utils/claude.ts` | AI routing: askWearIt, getOutfitSuggestion, tagClothingItem |
| `utils/modelAdapter.ts` | OpenAI-compatible fallback adapter |
| `utils/storage.ts` | AsyncStorage CRUD |
| `utils/weather.ts` | Weather API (currently hardcoded location) |

## Planned

- User-customizable themes (full Theme object swap)
- Outfit history + favorites
- Demo screenshots for README + App Store
- Opt-in wardrobe data sharing (users paid for taste data)
