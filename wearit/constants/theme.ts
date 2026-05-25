/**
 * WearIt Design System
 *
 * All visual values live here. Components import from this file — never hardcode
 * colors, spacing, or radius values inline.
 *
 * ARCHITECTURE NOTE — Theme swappability:
 * WearIt is heading toward user-customizable themes ("modern MySpace" — users pick
 * their own aesthetic, e.g. Disney Channel, Dark Academia, Y2K, Clean Girl).
 * The Theme type is the contract. A ThemeContext will eventually provide the active
 * theme throughout the app. For now, WearItTheme is the single source of truth and
 * all components reference it. When theme switching ships, components won't change —
 * only the context value will.
 */

// ─────────────────────────────────────────────
// THEME TYPE — the contract every theme must fulfill
// ─────────────────────────────────────────────

export type Theme = {
  // Surfaces
  background: string      // main screen background
  surface: string         // card / input background
  surfaceTint: string     // selected / hover state surface

  // Text
  textPrimary: string     // headings, body
  textSecondary: string   // labels, captions, muted
  textPlaceholder: string // input placeholder
  textOnAccent: string    // text on accent-colored backgrounds

  // Brand
  accent: string          // primary CTA, active tab, selection ring
  accentMuted: string     // secondary/outline states
  accentDanger: string    // destructive actions, error states

  // Borders
  border: string          // card borders, input borders
  borderSubtle: string    // dividers, very light separators

  // Tab bar
  tabActive: string
  tabInactive: string
  tabBar: string
  tabBarBorder: string

  // Section labels (ALL CAPS small headers)
  sectionLabel: string
}

// ─────────────────────────────────────────────
// WEARIT DEFAULT THEME — warm terracotta
// ─────────────────────────────────────────────

export const WearItTheme: Theme = {
  background:      '#FAF7F2',
  surface:         '#FFFFFF',
  surfaceTint:     '#FEF6F2',

  textPrimary:     '#2C1F1A',
  textSecondary:   '#8C5E4A',
  textPlaceholder: '#C4A898',
  textOnAccent:    '#FFFFFF',

  accent:          '#C97B5A',
  accentMuted:     '#8C5E4A',
  accentDanger:    '#8B3A1F',

  border:          'rgba(44,31,26,0.10)',
  borderSubtle:    'rgba(44,31,26,0.06)',

  tabActive:       '#C97B5A',
  tabInactive:     '#8C5E4A',
  tabBar:          '#FAF7F2',
  tabBarBorder:    'rgba(44,31,26,0.10)',

  sectionLabel:    '#C97B5A',
}

// ─────────────────────────────────────────────
// FUTURE THEMES — uncomment and expand as customization ships
// ─────────────────────────────────────────────

// export const DisneyChannelTheme: Theme = { ... }
// export const DarkAcademiaTheme: Theme = { ... }
// export const Y2KTheme: Theme = { ... }
// export const CleanGirlTheme: Theme = { ... }

// ─────────────────────────────────────────────
// TYPOGRAPHY
// ─────────────────────────────────────────────

export const Typography = {
  // Sizes
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   16,
    lg:   18,
    xl:   22,
    xxl:  28,
  },
  // Weights
  weight: {
    regular: '400' as const,
    medium:  '500' as const,
    semi:    '600' as const,
    bold:    '700' as const,
  },
  // Line heights
  lineHeight: {
    tight:  18,
    normal: 20,
    relaxed: 24,
  },
  // Named text styles — use these for consistency
  styles: {
    screenTitle:  { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
    sectionLabel: { fontSize: 11, fontWeight: '600' as const, letterSpacing: 0.8, textTransform: 'uppercase' as const },
    body:         { fontSize: 15, fontWeight: '500' as const, lineHeight: 24 },
    bodySmall:    { fontSize: 13, fontWeight: '400' as const, lineHeight: 20 },
    caption:      { fontSize: 11, fontWeight: '400' as const, lineHeight: 16 },
    btnLabel:     { fontSize: 16, fontWeight: '600' as const },
    btnLabelSm:   { fontSize: 14, fontWeight: '600' as const },
    italic:       { fontSize: 13, fontWeight: '400' as const, fontStyle: 'italic' as const, lineHeight: 20 },
  },
}

// ─────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────

export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  screen: 20,   // standard screen horizontal padding
}

// ─────────────────────────────────────────────
// RADIUS
// ─────────────────────────────────────────────

export const Radius = {
  sm:   8,
  md:   12,  // inputs, small buttons
  lg:   14,  // primary buttons
  xl:   16,  // cards
  full: 999, // pills, chips, avatar
}

// ─────────────────────────────────────────────
// SHADOWS (elevation equivalents)
// ─────────────────────────────────────────────

export const Shadow = {
  card: {
    shadowColor:   '#2C1F1A',
    shadowOffset:  { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius:  8,
    elevation:     3,
  },
  modal: {
    shadowColor:   '#2C1F1A',
    shadowOffset:  { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius:  16,
    elevation:     8,
  },
}
