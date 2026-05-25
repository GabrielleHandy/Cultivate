# WearIt + Cultivate — Project Memory

This file is loaded at the start of every session. Keep it current.

---

## Project Vision

**WearIt** is an AI-powered wardrobe assistant. The long-term vision is "modern MySpace for your closet" — users customize their WearIt aesthetic (Disney Channel, Dark Academia, Y2K, Clean Girl, etc.). Each theme is a complete visual identity. The app should feel personal, not utilitarian.

**Cultivate** is a personalized AI bootcamp generator — adaptive mentorship that learns how you think and closes the gap between "code that runs" and "code I understand." WearIt is the first live app in the Cultivate ecosystem.

**The Cultivate Empire — product roadmap:**
- **WearIt** — live now. AI wardrobe assistant. Proof of concept + portfolio piece.
- **LearnIt** — next. AI-powered learning companion for builders. Closes the gap between "code that runs" and "code I understand." Adaptive, personal, learns how you think.
- **EnvisionIt** — after that. AI co-founder for early-stage builders. Turns vision into strategy, strategy into execution. The product Gabby is dog-fooding right now through Cowork.

**Cultivate hardware + extended ecosystem (longer horizon):**
- **AR try-on** — extension of WearIt avatar. You become the avatar. Try on real clothes (or items you want) overlaid on your actual body via AR glasses. Style exploration without the dressing room.
- **Cultivate Mirror** — smart mirror as physical product. Shows WearIt outfit suggestions as AR overlays. Tracks body goals. Turns your morning routine into a goal-visualization moment every single day.
- **Cultivate Journal** — physical/digital idea surface. Displays inspiration, organizes brain dumps, captures ideas before they disappear. The external brain for people who think faster than they can write.
- **EnvisionIt VR** — goal visualization as immersive experience. Walk through your future life, see yourself in your goal state. Core insight: emotional + mental representation of a goal makes it stick. Visualization isn't woo — it's how the brain encodes future states as familiar rather than abstract. The more vividly you can see it, the more real it becomes.

**The through-line:** All Cultivate products are the same idea at different scales — technology that helps you see yourself more clearly. Style (WearIt), knowledge (LearnIt), vision (EnvisionIt), body (Mirror), mind (Journal). One thesis, many surfaces.

**Meta-insight:** These Cowork sessions ARE the prototype of LearnIt/EnvisionIt. The experience of having an AI that knows your project, holds context, keeps you accountable, executes tasks, and helps you learn while building — that's the product. Build it by living it.

**Builder:** Gabrielle Handy — frontend engineer at CVS Health, building WearIt as a portfolio project and real product. Has ideas faster than she has time. Needs help staying grounded and executing one thing at a time.

---

## WearIt App — Current State

**Live features:**
- Wardrobe — category-grouped horizontal scroll layout (rebuilt May 2026). `WardrobeCard` (portrait 110×148, photo overlay), `EmptyWardrobe` state. All token-clean.
- Wardrobe CRUD (add via camera or photo library, Claude auto-tags name/category/color)
- Outfit suggestions (three-tier AI chain: Claude API → user-configured OpenAI-compatible model → graceful degradation)
- Weather on Outfits screen — uses device GPS via expo-location (code written; needs `npx expo install expo-location` run from terminal)
- Wishlist (save items you want)
- Shopping tab (in progress — nav shows, content is skeleton)
- Settings tab — configure fallback AI model (any OpenAI-compatible endpoint: Ollama, Groq, OpenRouter, etc.)

**In progress / next priorities:**
1. **Groq setup** — Gabby needs free API key from console.groq.com. Preset in Settings: endpoint `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile`
2. **Run `npx expo install expo-location`** from terminal (weather code is already written and waiting)
3. **Delete dead file** `rm wearit/utils/testFallback.ts` — closes GitHub issue #4
4. **Add Dark Academia theme** — ThemeContext shipped; theme picker live in Settings. Next: add first alternate theme to `constants/theme.ts` + uncomment in `ThemeContext.tsx` THEMES registry.
5. **Icon direction decision** — W Hanger chosen (W monogram + hanger on top). Needs Canva polish in terracotta/cream palette.
6. **Shopping tab** — build out from skeleton
7. **Brand voice guidelines** — pre-launch, not now

**Bugs fixed (May 2026 session):**
- ✅ `copy()` in `saveImagePermanently` now properly awaited (race condition fixed)
- ✅ Usage counter now only increments after confirmed Claude success
- ✅ Weather no longer hardcoded to Winston-Salem — uses device location via expo-location
- ⏳ `testFallback.ts` dead file — needs manual terminal deletion (GitHub issue #4 open)

**GitHub issues:**
- #1 race condition copy() — CLOSED
- #2 usage counter — CLOSED  
- #3 weather hardcoded — CLOSED
- #4 testFallback.ts dead file — OPEN (needs `rm wearit/utils/testFallback.ts`)

---

## Repository Structure

```
cultivate/
├── wearit/                   # Live app — React Native + Expo
│   ├── app/
│   │   ├── (tabs)/
│   │   │   ├── wardrobe.tsx  # Category-section horizontal scroll layout (rebuilt May 2026)
│   │   │   ├── outfits.tsx   # AI outfit suggestion screen (token-clean, expo-location weather)
│   │   │   ├── shopping.tsx  # Wishlist / shopping tab (skeleton)
│   │   │   └── settings.tsx  # AI model configuration
│   │   ├── index.tsx         # Entry / splash
│   │   └── modal.tsx         # Add/edit item modal
│   ├── components/
│   │   └── ClothingCard.tsx  # Wardrobe grid card (fully token-clean May 2026)
│   ├── constants/
│   │   ├── theme.ts          # Design tokens — ALL visual values live here
│   │   └── types.ts          # TypeScript types + AiModelEndpoints
│   ├── hooks/
│   │   └── useImagePicker.ts
│   └── utils/
│       ├── claude.ts         # AI routing: askWearIt, getOutfitSuggestion, tagClothingItem
│       ├── modelAdapter.ts   # Universal OpenAI-compatible fallback adapter
│       ├── storage.ts        # AsyncStorage CRUD (wardrobe, wishlist, usage, training, model config)
│       ├── weather.ts        # Weather API
│       └── testFallback.ts   # DEAD FILE — delete this
├── cultivate-reference/      # Design specs for Cultivate mentor agent
├── .env.local                # GitHub PAT (gitignored — never paste token in chat)
└── CLAUDE.md                 # This file
```

---

## Design System

**All values are in `constants/theme.ts`. Never hardcode colors, spacing, or radius inline.**

### Colors (WearItTheme)
| Token | Value | Use |
|---|---|---|
| `background` | `#FAF7F2` | Screen backgrounds |
| `surface` | `#FFFFFF` | Cards, inputs |
| `surfaceTint` | `#FEF6F2` | Selected/hover |
| `textPrimary` | `#2C1F1A` | Headings, body |
| `textSecondary` | `#8C5E4A` | Labels, captions |
| `textPlaceholder` | `#C4A898` | Input placeholder |
| `accent` | `#C97B5A` | CTAs, active tab, selection |
| `accentDanger` | `#8B3A1F` | Destructive actions |
| `border` | `rgba(44,31,26,0.10)` | Card/input borders |

### Spacing
`xs:4 sm:8 md:12 base:16 lg:20 xl:24 screen:20`

### Radius
`sm:8 md:12 lg:14 xl:16 full:999`

### Typography roles
- Screen title: 22px bold
- Section label: 11px semibold, uppercase, accent color, letterSpacing 0.8
- Body: 15px medium
- Body small: 13px regular
- Button: 16px semibold

### Theme swappability (MySpace vision)
All tokens live in `constants/theme.ts`. ThemeContext is fully shipped (May 2026):
- `contexts/ThemeContext.tsx` — `WearItThemeProvider`, `useTheme()`, `THEMES` registry, `ThemeKey` type
- `WearItThemeProvider` wraps root in `app/_layout.tsx`
- All screens + components use `useTheme()` + `makeStyles(theme)` pattern — zero hardcoded colors
- Theme picker UI live in Settings → Appearance
- Next step: add first alternate theme (Dark Academia) to `constants/theme.ts` and uncomment in THEMES registry — picker will show it automatically

---

## Component Conventions

### Screens
```tsx
import { WearItTheme, Spacing, Radius, Typography } from '@/constants/theme'

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WearItTheme.background,
    padding: Spacing.screen,
    paddingTop: 40,
  },
})
```

### Cards
```tsx
card: {
  backgroundColor: WearItTheme.surface,
  borderRadius: Radius.xl,
  padding: Spacing.base,
  borderWidth: 1,
  borderColor: WearItTheme.border,
}
```

### Primary buttons
```tsx
btn: { backgroundColor: WearItTheme.accent, borderRadius: Radius.lg, padding: Spacing.base, alignItems: 'center' }
btnText: { color: WearItTheme.textOnAccent, ...Typography.styles.btnLabel }
```

### Section labels
```tsx
sectionLabel: { ...Typography.styles.sectionLabel, color: WearItTheme.sectionLabel, marginBottom: Spacing.sm }
```

---

## AI Architecture

```
askWearIt(items, context)
  Tier 1: Claude API (claude-sonnet-4-5) — while under monthly cap
  Tier 2: modelAdapter — any OpenAI-compatible endpoint (user-configured)
  Tier 3: Graceful degradation with CTA to configure a model
```

Few-shot training examples saved after every successful Claude suggestion (last 20 kept) and injected into Tier 2 prompts. Hardened cross-model prompt: format constraint first, JSON escape hatch so models never break format to hedge.

**Recommended fallback:** Groq (free tier) — endpoint `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile`. Preset exists in Settings screen. Gabby needs key from console.groq.com.

---

## Secrets / Credentials

**`.env.local`** (gitignored via `.env*.local` pattern — NEVER paste tokens in chat):
- `GITHUB_TOKEN` — Fine-grained PAT for GabrielleHandy/Cultivate repo (issues read/write)
- `GITHUB_REPO=GabrielleHandy/Cultivate`

To use GitHub API in a session: `Read` the `.env.local` file to get the token, then use Chrome MCP JS fetch.

---

## Coding Conventions

- TypeScript throughout — no `any` unless absolutely necessary
- AsyncStorage for all persistence
- Expo Router file-based routing — screens in `app/(tabs)/`
- `useFocusEffect + useCallback` for data loading on screen focus
- `StyleSheet.create` — never inline styles
- All async calls wrapped in try/catch with typed fallback values
- New utils exported and typed from `utils/`

---

## Brand / Icon

**Direction being explored (May 2026):**
- Direction A — Hand mirror (terracotta/cream, elegant, self-expression angle)
- Direction B — W monogram (stylized, fashion-forward, brand-iconic)
- 8 Canva concepts generated total. Awaiting Gabby's direction choice before refining.

**Long-term aesthetic:** "Modern MySpace for your closet" — personal, not utilitarian. Each theme = complete visual identity (Disney Channel, Dark Academia, Y2K, Clean Girl, etc.).

---

## Ideas Backlog

- [2026-05-25] Idea: Avatar dressing as ongoing style signal — user dresses a virtual avatar (MySpace/Sims-era nostalgia, Stardoll energy). Every styling choice is passive data: silhouettes, color combinations, coverage, occasion. Feeds the same style DNA profile as the quiz but continuously, not just at onboarding. Three-layer style intelligence system: (1) Quiz → initial style fingerprint, (2) Avatar → ongoing refinement, (3) Real wardrobe → ground truth of what they own. Claude sits on top of all three layers and gets smarter over time. Avatar is also a social/sharing surface — very MySpace.
- [2026-05-25] Idea: Opt-in wardrobe/purchase data sharing with brands — users get paid for their taste data, full opt-out for complete privacy. Like Fetch Rewards but for fashion data. Connects to "users own their data" vision. Key design constraint: radical transparency. Needs dedicated data consent screen + "My Data" section in Settings.
- [2026-05-25] Idea: AI-generated themes — Claude analyzes the app's existing color tokens, radius values, and spacing, then generates complete Theme objects from a user-typed aesthetic prompt ("Dark Academia", "Y2K", "Coastal Grandmother", etc.). User sees a preview, confirms, and the theme is saved. Unlocks infinite themes without manual design work. Would live in the theme picker in Settings.
- [2026-05-25] Idea: Style Game — "What's Your Vibe?" onboarding/discovery quiz. Magazine/Buzzfeed-style quiz format (think early 2000s Cosmo/Teen Vogue) — scenario-based questions with personality and voice, not just image pairs. "It's Saturday morning, what are you wearing?" reveals more than picking photos. ~10-12 questions, decision-tree logic. Result: a named aesthetic persona ("The Mysterious Librarian" / "Y2K Dreamer" etc.) that feels like an identity statement, not a data output. Shareable result card = organic growth. Revealed preferences beat stated preferences — people can't articulate their style but they can always answer "you're running late, do you grab the first thing or take the 10 minutes?" Result seeds: (1) matching theme suggestion, (2) style DNA context so Claude suggests outfits through the user's aesthetic lens, not the statistical middle. Fits perfectly with MySpace nostalgia brand direction. WearIt's answer to algorithmic convergence — the anti-algorithm. **Requirements:** (1) Questions must be written with editorial voice and personality — Claude authors the questions, not just generates them. Think Teen Vogue writer, not survey designer. (2) Avatar dressing (see below) feeds the same style DNA profile as a continuous signal layer on top of the one-time quiz.

---

## Session Rules

1. One feature at a time. Log new ideas but don't start them until current one ships.
2. Before any new screen/component, check if the pattern already exists.
3. Fix known bugs before adding features where they'd interfere.
4. Design system is source of truth — flag any hardcoded color you find.
5. **Default to action.** After completing a task, review progress and move to the next priority — don't ask "want to do X?" Just do it. Only stop for real decisions that require Gabby's input (design choices, credentials, direction calls).
