# Tasks

## Ship blockers (do these to call WearIt "shipped")

- [ ] **Run `npx expo install expo-location`** — weather location code is written and waiting; run from `wearit/` directory
- [ ] **Get Groq API key** — free tier at console.groq.com; preset already in Settings (endpoint + model saved). Unlocks outfit AI fallback without usage credits
- [ ] **Demo screenshots for README and App Store** — needed for portfolio + publishing

## Active

- [ ] **W Hanger logo — Canva polish** — direction decided: W monogram + hanger on top. Need 3–4 polished variations in WearIt terracotta/cream palette. W Closet saved as illustration asset, W Shirt dropped.
- [ ] **Shopping tab** — build out from skeleton
- [ ] **AI model pill on Outfits screen** — replace settings tab with contextual in-screen AI switcher (deprioritized until Groq is set up)

## Someday

- [ ] **Style Game — "What's Your Vibe?"** — Magazine/Buzzfeed-style quiz (~10-12 scenario questions with editorial voice). Result: named aesthetic persona + shareable card. Seeds theme suggestion + style DNA for outfit AI. Questions authored with personality, not generated as a survey. Avatar dressing (see below) is the continuous signal layer on top.
- [ ] **Avatar dressing** — MySpace/Sims-era virtual self-styling. Passive style data from every choice (silhouette, color, occasion). Feeds same style DNA profile as the quiz but ongoing. Social/sharing surface. Part of the three-layer style intelligence system: Quiz → Avatar → Real wardrobe.
- [ ] **Opt-in wardrobe data sharing** — users get paid for taste data; needs consent screen + "My Data" in Settings
- [ ] **Brand voice guidelines** — pre-launch, not now
- [ ] **LearnIt** — AI learning companion; next product after WearIt ships
- [ ] **EnvisionIt** — AI co-founder for early-stage builders; after LearnIt

## Done

- [x] **Dark Academia theme** — shipped. `DarkAcademiaTheme` in `constants/theme.ts`, registered in `ThemeContext` THEMES, live in Settings picker.
- [x] **AI-generated themes** — shipped. `generateTheme(aesthetic)` in `claude.ts` + `applyCustomTheme` in `ThemeContext` with persistence. User types an aesthetic, Claude returns a full Theme object, preview + save.
- [x] **Gap analysis** — `analyzeGap()` in `claude.ts`: compares a wishlist item to wardrobe, returns matches + what's missing.
- [x] **Profile, Inspo, item detail, wishlist detail screens** — built (`profile.tsx`, `inspo.tsx`, `item/[id].tsx`, `wishlist/[id].tsx`).
- [x] **AI on/off toggle** — `AIContext` + persisted flag; enforced in Outfits and Wardrobe.
- [x] **Remove dead testFallback.ts** — file deleted (GitHub #4 closeable).
- [x] **Remove dead/broken askBonsai** — referenced undefined `BONSAI_URL`, no callers; deleted from `claude.ts`.
- [x] **ThemeContext + useTheme() hook** — `contexts/ThemeContext.tsx` created; WearItThemeProvider wraps app in `_layout.tsx`; THEMES registry + ThemeKey type ready for new themes
- [x] **Theme swap across all screens/components** — wardrobe, outfits, shopping, settings, ClothingCard, tab bar `_layout` all use `useTheme()` + `makeStyles(theme)` pattern; zero hardcoded colors remaining
- [x] **Theme picker UI in Settings** — live under Appearance section; active state highlighted; new themes auto-appear when added to THEMES registry
- [x] **Fix copy() race condition in saveImagePermanently** — `await` added, race condition closed (GitHub #1 closed)
- [x] **Fix usage counter timing** — now increments only after confirmed Claude success (GitHub #2 closed)
- [x] **Fix hardcoded weather location** — uses device GPS via expo-location; code written (GitHub #3 closed)
- [x] **Wardrobe screen rebuild** — category-grouped horizontal scroll, WardrobeCard, EmptyWardrobe, fully token-clean
- [x] **ClothingCard.tsx token audit** — all hardcoded hex/spacing replaced with theme tokens
- [x] **outfits.tsx token audit** — fully token-clean
- [x] **GitHub issues #1–3 closed**
- [x] **Store GitHub PAT in .env.local** — no more pasting tokens in chat
