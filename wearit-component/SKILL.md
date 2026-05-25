---
name: wearit-component
description: |
  Use this skill whenever working on the WearIt app — generating new screens, building components, reviewing existing code, or checking whether code follows the design system. Trigger on: "make a screen", "build a component", "new tab", "add a feature to WearIt", "review this WearIt code", "does this follow the design system", "make an AI pill", "build a card", or any time you are about to write or edit a .tsx file in the wearit/ directory. This skill contains the full WearIt design system so code comes out right the first time without re-reading source files every session.
---

# WearIt Component Skill

You are working inside the WearIt app — an AI-powered wardrobe assistant built with React Native, TypeScript, and Expo Router. This skill gives you everything you need to generate consistent, on-brand code without re-reading source files every session.

## Design System

All visual values live in `constants/theme.ts`. Never hardcode colors, spacing, or radius values inline — always import from theme.

### Import line
```tsx
import { WearItTheme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
```

### Color tokens (WearItTheme)
| Token | Value | When to use |
|---|---|---|
| `background` | `#FAF7F2` | Screen backgrounds |
| `surface` | `#FFFFFF` | Cards, inputs, modals |
| `surfaceTint` | `#FEF6F2` | Selected/hover states |
| `textPrimary` | `#2C1F1A` | Headings, body text |
| `textSecondary` | `#8C5E4A` | Labels, captions, muted |
| `textPlaceholder` | `#C4A898` | Input placeholders |
| `textOnAccent` | `#FFFFFF` | Text on accent-colored backgrounds |
| `accent` | `#C97B5A` | CTAs, active tab, selection ring |
| `accentMuted` | `#8C5E4A` | Outline buttons, secondary actions |
| `accentDanger` | `#8B3A1F` | Destructive actions, errors |
| `border` | `rgba(44,31,26,0.10)` | Card and input borders |
| `borderSubtle` | `rgba(44,31,26,0.06)` | Dividers |

### Spacing (`Spacing.*`)
`xs:4  sm:8  md:12  base:16  lg:20  xl:24  xxl:32  screen:20`

### Radius (`Radius.*`)
`sm:8  md:12  lg:14  xl:16  full:999`
- Inputs → `Radius.md`
- Primary buttons → `Radius.lg`
- Cards → `Radius.xl`
- Pills/chips/avatars → `Radius.full`

### Typography (`Typography.styles.*`)
```
screenTitle:  22px bold
sectionLabel: 11px semibold, uppercase, letterSpacing 0.8
body:         15px medium
bodySmall:    13px regular
caption:      11px regular
btnLabel:     16px semibold
italic:       13px regular italic
```

---

## Component Patterns

Use these structures. Deviate only with a clear reason.

### Screen shell
```tsx
import { View, StyleSheet } from 'react-native'
import { WearItTheme, Spacing } from '@/constants/theme'

export default function MyScreen() {
  return (
    <View style={styles.screen}>
      {/* content */}
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: WearItTheme.background,
    padding: Spacing.screen,
    paddingTop: 40,
  },
})
```
For scrollable screens use `<ScrollView style={styles.screen} contentContainerStyle={styles.content}>` with `content: { padding: Spacing.screen, paddingTop: 40, paddingBottom: 48 }`.

### Primary button
```tsx
btn: {
  backgroundColor: WearItTheme.accent,
  borderRadius: Radius.lg,
  padding: Spacing.base,
  alignItems: 'center',
},
btnText: {
  color: WearItTheme.textOnAccent,
  ...Typography.styles.btnLabel,
},
```

### Outline button
```tsx
outlineBtn: {
  borderWidth: 1,
  borderColor: WearItTheme.accent,
  borderRadius: Radius.md,
  padding: Spacing.base,
  alignItems: 'center',
},
outlineBtnText: {
  color: WearItTheme.accent,
  ...Typography.styles.btnLabel,
},
```

### Card
```tsx
card: {
  backgroundColor: WearItTheme.surface,
  borderRadius: Radius.xl,
  padding: Spacing.base,
  borderWidth: 1,
  borderColor: WearItTheme.border,
  ...Shadow.card,
},
```

### Text input
```tsx
input: {
  backgroundColor: WearItTheme.surface,
  borderRadius: Radius.md,
  padding: 14,
  ...Typography.styles.body,
  color: WearItTheme.textPrimary,
  borderWidth: 1,
  borderColor: WearItTheme.border,
  marginBottom: Spacing.base,
},
```
Always set `placeholderTextColor={WearItTheme.textPlaceholder}`.

### Section label (ALL CAPS small header used throughout the app)
```tsx
sectionLabel: {
  ...Typography.styles.sectionLabel,
  color: WearItTheme.sectionLabel,
  marginBottom: Spacing.sm,
},
```

### Pill / chip
```tsx
pill: {
  backgroundColor: WearItTheme.surface,
  borderRadius: Radius.full,
  paddingHorizontal: Spacing.md,
  paddingVertical: Spacing.sm,
  borderWidth: 1,
  borderColor: WearItTheme.border,
},
pillText: { ...Typography.styles.bodySmall, color: WearItTheme.textSecondary },
// Active state:
pillActive: { backgroundColor: WearItTheme.accent, borderColor: WearItTheme.accent },
pillActiveText: { color: WearItTheme.textOnAccent },
```

### Status / info card
```tsx
statusCard: {
  backgroundColor: WearItTheme.surface,
  borderRadius: Radius.md,
  padding: Spacing.base,
  borderWidth: 1,
  borderColor: WearItTheme.borderSubtle,
},
```

---

## Architecture Rules

**File locations:**
- Screens → `app/(tabs)/screenname.tsx`
- Reusable components → `components/ComponentName.tsx`
- Utilities → `utils/utilname.ts`
- Types → `constants/types.ts`
- Always use path alias `@/` (not relative paths)

**Data loading:**
- Use `useFocusEffect(useCallback(...))` for loading data when a screen comes into focus — not `useEffect`
- All AsyncStorage operations come from `utils/storage.ts` — never call AsyncStorage directly in a screen
- Wrap all async calls in try/catch with typed fallback values

**TypeScript:**
- No `any` unless genuinely unavoidable
- All props typed inline or with a type from `constants/types.ts`

**Styling:**
- `StyleSheet.create` only — never inline styles on non-trivial properties
- Group related styles with a blank line between sections

---

## Generating a New Screen

1. Identify: what data does it need, what actions does it have, does it scroll?
2. Check `constants/types.ts` for existing types before creating new ones
3. Check `utils/storage.ts` for existing data operations before adding new ones
4. Scaffold from the screen shell above using only design system tokens
5. Add to `app/(tabs)/_layout.tsx` if it needs a tab bar entry

## Generating a New Component

1. Type all props explicitly
2. Build from the relevant pattern above (card, pill, button, etc.)
3. Keep components display-only — logic stays in screens
4. Export as default from `components/ComponentName.tsx`

## Reviewing Existing Code

Check for:
- Hardcoded hex colors → replace with theme token
- Hardcoded spacing numbers not from `Spacing.*`
- Inline styles on non-trivial properties
- AsyncStorage called directly in a screen (should go through `utils/storage.ts`)
- `useEffect` for focus-based data loading (should be `useFocusEffect`)
- Missing try/catch on async calls

For each issue: show the line, explain why it matters, give the corrected version.

## Theme Swappability Note

WearIt is heading toward user-customizable themes ("modern MySpace" vision — Disney Channel, Dark Academia, Y2K, etc.). Always use `WearItTheme.*` tokens rather than importing color values directly. When theme switching ships, components won't need to change — only the context value will.
