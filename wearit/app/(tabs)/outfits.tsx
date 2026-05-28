import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Dimensions,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, router } from 'expo-router'
import * as Location from 'expo-location'
import { loadWardrobe, loadSavedOutfits, saveOutfit, deleteSavedOutfit } from '@/utils/storage'
import { askWearIt } from '@/utils/claude'
import { getWeather } from '@/utils/weather'
import { WearItSuggestion, SavedOutfit, ClothingItem } from '@/constants/types'
import { Image } from 'react-native'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
// 2-col grid card width: total width minus horizontal padding (screen * 2) minus gap between cards
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.base) / 2

// ─── Saved outfit card ─────────────────────────────────────────────────────

function OutfitCard({ outfit, theme, onDelete }: {
  outfit: SavedOutfit
  theme: Theme
  onDelete: () => void
}) {
  const styles = useMemo(() => makeCardStyles(theme), [theme])
  const date = new Date(outfit.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  // Trim suggestion to first two sentences for the card preview
  const preview = outfit.suggestion.split('.').slice(0, 2).join('.').replace(/\*\*(.*?)\*\*/g, '$1').trim()

  return (
    <TouchableOpacity
      style={styles.card}
      onLongPress={onDelete}
      activeOpacity={0.85}
      delayLongPress={400}
    >
      {/* Occasion pill */}
      {outfit.occasion ? (
        <View style={styles.occasionPill}>
          <Text style={styles.occasionText} numberOfLines={1}>{outfit.occasion}</Text>
        </View>
      ) : null}

      {/* Outfit preview text */}
      <Text style={styles.preview} numberOfLines={4}>{preview}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {outfit.weather ? (
          <Text style={styles.meta} numberOfLines={1}>🌤 {outfit.weather.split('·')[0].trim()}</Text>
        ) : null}
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  )
}

const makeCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: theme.surfaceTint,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    gap: Spacing.sm,
    ...Shadow.card,
  },
  occasionPill: {
    backgroundColor: theme.accent,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  occasionText: {
    fontSize: 10,
    fontFamily: 'DMSans_500Medium',
    color: theme.textOnAccent,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  preview: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 13,
    color: theme.textPrimary,
    lineHeight: 19,
    flex: 1,
  },
  footer: {
    gap: 2,
  },
  meta: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: theme.textSecondary,
  },
  date: {
    fontSize: 10,
    fontFamily: 'DMSans_400Regular',
    color: theme.textSecondary,
  },
})

// ─── Main screen ────────────────────────────────────────────────────────────

export default function OutfitsScreen() {
  const { theme } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [suggestion, setSuggestion] = useState<WearItSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('')
  const [weather, setWeather] = useState('')
  const [savedLooks, setSavedLooks] = useState<SavedOutfit[]>([])
  const [saving, setSaving] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([])

  // Detect weather on mount
  useEffect(() => {
    ;(async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync()
        if (status !== 'granted') return
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low })
        const [place] = await Location.reverseGeocodeAsync(loc.coords)
        const city = place.city || place.subregion || place.region || ''
        if (city) {
          const w = await getWeather(city)
          if (w) setWeather(`${w} · ${city}`)
        }
      } catch {
        // Weather is optional — fail silently
      }
    })()
  }, [])

  // Reload saved looks every time this tab is focused
  useFocusEffect(
    useCallback(() => {
      loadSavedOutfits().then(setSavedLooks)
    }, [])
  )

  const handleAsk = async () => {
    setLoading(true)
    setSuggestion(null)
    setOutfitItems([])
    setIsFallback(false)
    try {
      const wardrobe = await loadWardrobe()
      if (wardrobe.length === 0) {
        setSuggestion({ suggestion: 'Add some clothes to your wardrobe first!', reason: '' })
        setIsFallback(true)
        return
      }
      const context = [occasion, weather ? `Weather: ${weather}` : ''].filter(Boolean).join('. ')
      const result = await askWearIt(wardrobe, context)
      setSuggestion(result)
      setIsFallback(false)

      // Match Claude's returned item names to actual wardrobe ClothingItem objects.
      // Claude sees the exact names in its prompt, so these should match precisely.
      // Lowercase comparison guards against capitalisation differences.
      if (result.itemNames && result.itemNames.length > 0) {
        const matched = wardrobe.filter(item =>
          result.itemNames!.some(name => name.toLowerCase() === item.name.toLowerCase())
        )
        setOutfitItems(matched)
      }
    } catch {
      setSuggestion({ suggestion: 'Something went wrong. Try again.', reason: '' })
      setIsFallback(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveLook = async () => {
    if (!suggestion) return
    setSaving(true)
    try {
      const saved = await saveOutfit({
        suggestion: suggestion.suggestion,
        reason: suggestion.reason,
        occasion: occasion.trim(),
        weather,
        savedAt: new Date().toISOString(),
        itemIds: outfitItems.map(i => i.id),
      })
      setSavedLooks(prev => [saved, ...prev])
      setSuggestion(null)
      setOutfitItems([])
      setOccasion('')
    } catch {
      Alert.alert('Could not save', 'Something went wrong. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLook = (outfit: SavedOutfit) => {
    Alert.alert(
      'Remove this look?',
      outfit.occasion ? `"${outfit.occasion}" — this can't be undone.` : "This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteSavedOutfit(outfit.id)
            setSavedLooks(prev => prev.filter(o => o.id !== outfit.id))
          },
        },
      ]
    )
  }

  // Group saved looks into rows of 2 for the grid
  // Can't use FlatList inside a ScrollView — React Native warns about nested VirtualizedLists
  // and scroll behavior breaks. Manual row chunking is the correct pattern here.
  const rows = savedLooks.reduce<SavedOutfit[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item])
    else acc[acc.length - 1].push(item)
    return acc
  }, [])

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Outfits</Text>
          {weather ? (
            <View style={styles.weatherChip}>
              <Ionicons name="partly-sunny-outline" size={12} color={theme.textSecondary} />
              <Text style={styles.weatherText}>{weather}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Generate form ────────────────────────────── */}
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="What's the occasion?"
            placeholderTextColor={theme.textPlaceholder}
            value={occasion}
            onChangeText={setOccasion}
            returnKeyType="done"
          />
          <TouchableOpacity
            style={[styles.generateBtn, loading && styles.generateBtnDisabled]}
            onPress={handleAsk}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.textOnAccent} size="small" />
            ) : (
              <>
                <Ionicons name="sparkles-outline" size={16} color={theme.textOnAccent} />
                <Text style={styles.generateBtnText}>Suggest an Outfit</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* ── Suggestion card ──────────────────────────── */}
        {suggestion && (
          <View style={styles.suggestionCard}>

            {/* Linked wardrobe items — horizontal scroll row */}
            {outfitItems.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemRow}
              >
                {outfitItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => router.push({
                      pathname: '/(tabs)/item/[id]',
                      params: { id: item.id, name: item.name, category: item.category, emoji: item.emoji, photoUri: item.photoUri ?? '' },
                    })}
                    activeOpacity={0.8}
                  >
                    {item.photoUri ? (
                      <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                    ) : (
                      <View style={styles.itemEmoji}>
                        <Text style={styles.itemEmojiText}>{item.emoji}</Text>
                      </View>
                    )}
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.suggestionText}>
              {suggestion.suggestion.replace(/\*\*(.*?)\*\*/g, '$1')}
            </Text>
            {suggestion.reason ? (
              <Text style={styles.reasonText}>
                {suggestion.reason.replace(/\*\*(.*?)\*\*/g, '$1')}
              </Text>
            ) : null}

            {!isFallback && (
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSaveLook}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={theme.textOnAccent} size="small" />
                ) : (
                  <>
                    <Ionicons name="heart-outline" size={16} color={theme.textOnAccent} />
                    <Text style={styles.saveBtnText}>Save this look</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.dismissBtn} onPress={() => setSuggestion(null)}>
              <Text style={styles.dismissText}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Saved looks board ────────────────────────── */}
        {savedLooks.length > 0 && (
          <View style={styles.boardSection}>
            <Text style={styles.boardLabel}>SAVED LOOKS</Text>
            <Text style={styles.boardHint}>Hold a card to remove it</Text>

            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.row}>
                {row.map(outfit => (
                  <OutfitCard
                    key={outfit.id}
                    outfit={outfit}
                    theme={theme}
                    onDelete={() => handleDeleteLook(outfit)}
                  />
                ))}
                {/* Fill empty slot in last row if odd number of looks */}
                {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
              </View>
            ))}
          </View>
        )}

        {/* Empty board state */}
        {savedLooks.length === 0 && !suggestion && !loading && (
          <View style={styles.emptyBoard}>
            <Ionicons name="albums-outline" size={40} color={theme.border} />
            <Text style={styles.emptyText}>Your saved looks will appear here</Text>
          </View>
        )}

        <View style={{ height: Spacing.xxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  scrollContent: {
    paddingHorizontal: Spacing.screen,
    paddingTop: 52,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 30,
    color: theme.textPrimary,
  },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: theme.border,
  },
  weatherText: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
  },

  // ── Generate form ────────────────────────────────────────
  formCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Spacing.base,
    ...Shadow.card,
  },
  input: {
    ...Typography.styles.body,
    color: theme.textPrimary,
    backgroundColor: theme.background,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: theme.border,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: theme.accent,
    borderRadius: Radius.lg,
    paddingVertical: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: {
    ...Typography.styles.btnLabel,
    color: theme.textOnAccent,
  },

  // ── Outfit item row ─────────────────────────────────────
  itemRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  itemCard: {
    width: 80,
    alignItems: 'center',
    gap: 6,
  },
  itemPhoto: {
    width: 80,
    height: 100,
    borderRadius: Radius.lg,
    resizeMode: 'cover',
  },
  itemEmoji: {
    width: 80,
    height: 100,
    borderRadius: Radius.lg,
    backgroundColor: theme.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.border,
  },
  itemEmojiText: {
    fontSize: 36,
  },
  itemName: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Suggestion card ─────────────────────────────────────
  suggestionCard: {
    backgroundColor: theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: Spacing.xl,
    gap: Spacing.md,
    ...Shadow.lifted,
  },
  suggestionText: {
    fontFamily: 'PlayfairDisplay_400Regular',
    fontSize: 16,
    color: theme.textPrimary,
    lineHeight: 26,
  },
  reasonText: {
    ...Typography.styles.italic,
    color: theme.textSecondary,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: theme.accent,
    borderRadius: Radius.lg,
    paddingVertical: 12,
    marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    ...Typography.styles.btnLabelSm,
    color: theme.textOnAccent,
  },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  dismissText: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
  },

  // ── Saved looks board ────────────────────────────────────
  boardSection: {
    gap: Spacing.base,
  },
  boardLabel: {
    ...Typography.styles.sectionLabel,
    color: theme.sectionLabel,
  },
  boardHint: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    marginTop: -Spacing.sm,
    marginBottom: Spacing.sm,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.base,
  },

  // ── Empty board state ────────────────────────────────────
  emptyBoard: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.base,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    opacity: 0.5,
  },
  emptyText: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
  },
})
