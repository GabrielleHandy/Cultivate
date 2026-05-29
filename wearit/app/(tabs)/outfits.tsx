import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, ScrollView, Alert, Dimensions,
  KeyboardAvoidingView, Platform, Image, Modal, FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect, router } from 'expo-router'
import * as Location from 'expo-location'
import { loadWardrobe, loadSavedOutfits, saveOutfit, deleteSavedOutfit } from '@/utils/storage'
import { askWearIt } from '@/utils/claude'
import { randomizeOutfit } from '@/utils/outfitRandomizer'
import { getWeather } from '@/utils/weather'
import { WearItSuggestion, SavedOutfit, ClothingItem } from '@/constants/types'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'
import { useAI } from '@/contexts/AIContext'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const CARD_WIDTH = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.base) / 2

const CATEGORY_EMOJI: Record<string, string> = {
  Tops: '👕', Bottoms: '👖', Shoes: '👟',
  Dresses: '👗', Outerwear: '🧥', Accessories: '👜', Other: '🎽',
}

// ─── Saved outfit card ─────────────────────────────────────────────────────

function OutfitCard({ outfit, theme, onDelete }: {
  outfit: SavedOutfit; theme: Theme; onDelete: () => void
}) {
  const styles = useMemo(() => makeCardStyles(theme), [theme])
  const date = new Date(outfit.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const preview = outfit.suggestion.split('.').slice(0, 2).join('.').replace(/\*\*(.*?)\*\*/g, '$1').trim()

  return (
    <TouchableOpacity style={styles.card} onLongPress={onDelete} activeOpacity={0.85} delayLongPress={400}>
      {outfit.occasion ? (
        <View style={styles.occasionPill}>
          <Text style={styles.occasionText} numberOfLines={1}>{outfit.occasion}</Text>
        </View>
      ) : null}
      <Text style={styles.preview} numberOfLines={4}>{preview}</Text>
      <View style={styles.footer}>
        {outfit.weather ? <Text style={styles.meta} numberOfLines={1}>🌤 {outfit.weather.split('·')[0].trim()}</Text> : null}
        <Text style={styles.date}>{date}</Text>
      </View>
    </TouchableOpacity>
  )
}

const makeCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: CARD_WIDTH, backgroundColor: theme.surfaceTint,
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: theme.border, gap: Spacing.sm, ...Shadow.card,
  },
  occasionPill: {
    backgroundColor: theme.accent, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  occasionText: { fontSize: 10, fontFamily: 'DMSans_500Medium', color: theme.textOnAccent, textTransform: 'uppercase', letterSpacing: 0.5 },
  preview: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 13, color: theme.textPrimary, lineHeight: 19, flex: 1 },
  footer: { gap: 2 },
  meta: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: theme.textSecondary },
  date: { fontSize: 10, fontFamily: 'DMSans_400Regular', color: theme.textSecondary },
})

// ─── Wardrobe picker (for manual outfit builder) ───────────────────────────

function WardrobePicker({ visible, wardrobe, selected, onToggle, onClose, onSave, theme }: {
  visible: boolean
  wardrobe: ClothingItem[]
  selected: Set<string>
  onToggle: (id: string) => void
  onClose: () => void
  onSave: (name: string) => void
  theme: Theme
}) {
  const [outfitName, setOutfitName] = useState('')
  const styles = useMemo(() => makePickerStyles(theme), [theme])

  const byCategory = (cat: ClothingItem['category']) => wardrobe.filter(i => i.category === cat)
  const filledCategories = ['Tops', 'Bottoms', 'Shoes', 'Dresses', 'Outerwear', 'Accessories', 'Other']
    .map(cat => ({ cat, items: byCategory(cat as ClothingItem['category']) }))
    .filter(g => g.items.length > 0)

  const handleSave = () => {
    if (selected.size === 0) {
      Alert.alert('No items selected', 'Pick at least one item for your outfit.')
      return
    }
    onSave(outfitName.trim() || 'My Outfit')
    setOutfitName('')
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.screen, { backgroundColor: theme.background }]}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Ionicons name="close" size={22} color={theme.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.textPrimary }]}>Build an Outfit</Text>
          <TouchableOpacity onPress={handleSave}>
            <Text style={[styles.saveLabel, { color: theme.accent }]}>Save</Text>
          </TouchableOpacity>
        </View>

        {/* Outfit name */}
        <View style={styles.nameRow}>
          <TextInput
            style={[styles.nameInput, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="Name this outfit (optional)"
            placeholderTextColor={theme.textPlaceholder}
            value={outfitName}
            onChangeText={setOutfitName}
          />
        </View>

        {/* Selected count */}
        {selected.size > 0 && (
          <View style={[styles.selectedBanner, { backgroundColor: theme.surfaceTint, borderColor: theme.border }]}>
            <Ionicons name="checkmark-circle" size={14} color={theme.accent} />
            <Text style={[styles.selectedText, { color: theme.accent }]}>{selected.size} item{selected.size !== 1 ? 's' : ''} selected</Text>
          </View>
        )}

        {/* Wardrobe items by category */}
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
          {filledCategories.map(({ cat, items }) => (
            <View key={cat} style={styles.section}>
              <Text style={[styles.sectionLabel, { color: theme.sectionLabel }]}>
                {CATEGORY_EMOJI[cat]} {cat.toUpperCase()}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemRow}>
                {items.map(item => {
                  const isSelected = selected.has(item.id)
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.itemCard, isSelected && { borderColor: theme.accent, borderWidth: 2 }]}
                      onPress={() => onToggle(item.id)}
                      activeOpacity={0.75}
                    >
                      {item.photoUri ? (
                        <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                      ) : (
                        <View style={[styles.itemEmoji, { backgroundColor: theme.surfaceTint }]}>
                          <Text style={{ fontSize: 28 }}>{item.emoji}</Text>
                        </View>
                      )}
                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: theme.accent }]}>
                          <Ionicons name="checkmark" size={10} color={theme.textOnAccent} />
                        </View>
                      )}
                      <Text style={[styles.itemName, { color: theme.textSecondary }]} numberOfLines={2}>{item.name}</Text>
                    </TouchableOpacity>
                  )
                })}
              </ScrollView>
            </View>
          ))}
          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      </View>
    </Modal>
  )
}

const makePickerStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, paddingTop: Spacing.xl, paddingBottom: Spacing.base,
    borderBottomWidth: 1, borderBottomColor: theme.border,
  },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 18 },
  saveLabel: { fontFamily: 'DMSans_500Medium', fontSize: 16, fontWeight: '600' },
  nameRow: { paddingHorizontal: Spacing.screen, paddingTop: Spacing.base },
  nameInput: {
    borderRadius: Radius.md, borderWidth: 1,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: 14, fontFamily: 'DMSans_400Regular',
    marginBottom: Spacing.sm,
  },
  selectedBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginHorizontal: Spacing.screen, marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: Radius.md, borderWidth: 1,
  },
  selectedText: { ...Typography.styles.bodySmall, fontWeight: '600' },
  list: { paddingTop: Spacing.base },
  section: { marginBottom: Spacing.xl },
  sectionLabel: { ...Typography.styles.sectionLabel, paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm },
  itemRow: { paddingHorizontal: Spacing.screen, gap: Spacing.sm },
  itemCard: {
    width: 80, borderRadius: Radius.lg, overflow: 'hidden',
    borderWidth: 2, borderColor: 'transparent',
  },
  itemPhoto: { width: 80, height: 100, resizeMode: 'cover' },
  itemEmoji: { width: 80, height: 100, alignItems: 'center', justifyContent: 'center' },
  checkBadge: {
    position: 'absolute', top: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
  },
  itemName: { ...Typography.styles.caption, textAlign: 'center', paddingHorizontal: 4, paddingVertical: 4, lineHeight: 13 },
})

// ─── Main screen ────────────────────────────────────────────────────────────

export default function OutfitsScreen() {
  const { theme } = useTheme()
  const { aiEnabled } = useAI()
  const styles = useMemo(() => makeStyles(theme), [theme])

  const [suggestion, setSuggestion] = useState<WearItSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('')
  const [weather, setWeather] = useState('')
  const [savedLooks, setSavedLooks] = useState<SavedOutfit[]>([])
  const [saving, setSaving] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const [outfitItems, setOutfitItems] = useState<ClothingItem[]>([])

  // Manual outfit builder
  const [showPicker, setShowPicker] = useState(false)
  const [wardrobe, setWardrobe] = useState<ClothingItem[]>([])
  const [selectedIds, setSelectedIds] = useState(new Set<string>())

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
      } catch {}
    })()
  }, [])

  useFocusEffect(
    useCallback(() => {
      loadSavedOutfits().then(setSavedLooks)
      loadWardrobe().then(setWardrobe)
    }, [])
  )

  const handleAsk = async () => {
    setLoading(true)
    setSuggestion(null)
    setOutfitItems([])
    setIsFallback(false)
    try {
      if (wardrobe.length === 0) {
        setSuggestion({ suggestion: 'Add some clothes to your wardrobe first!', reason: '' })
        setIsFallback(true)
        return
      }
      const context = [occasion, weather ? `Weather: ${weather}` : ''].filter(Boolean).join('. ')
      const result = await askWearIt(wardrobe, context)
      setSuggestion(result)
      setIsFallback(false)
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

  const handleRandomize = () => {
    if (wardrobe.length === 0) {
      setSuggestion({ suggestion: 'Add some clothes to your wardrobe first!', reason: '' })
      setIsFallback(true)
      return
    }
    const context = [occasion, weather ? `Weather: ${weather}` : ''].filter(Boolean).join('. ')
    const result = randomizeOutfit(wardrobe, context)
    setSuggestion(result)
    setIsFallback(false)
    if (result.itemNames && result.itemNames.length > 0) {
      const matched = wardrobe.filter(item =>
        result.itemNames!.some(name => name.toLowerCase() === item.name.toLowerCase())
      )
      setOutfitItems(matched)
    }
  }

  const handleToggleItem = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const handleSaveManualOutfit = async (outfitName: string) => {
    const selectedItems = wardrobe.filter(i => selectedIds.has(i.id))
    const nameList = selectedItems.map(i => i.name).join(', ')
    const saved = await saveOutfit({
      suggestion: `${outfitName}: ${nameList}.`,
      reason: 'Manually built outfit.',
      occasion: occasion.trim() || outfitName,
      weather,
      savedAt: new Date().toISOString(),
      itemIds: selectedItems.map(i => i.id),
    })
    setSavedLooks(prev => [saved, ...prev])
    setSelectedIds(new Set())
    setShowPicker(false)
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
    Alert.alert('Remove this look?', outfit.occasion ? `"${outfit.occasion}" — this can't be undone.` : "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await deleteSavedOutfit(outfit.id)
          setSavedLooks(prev => prev.filter(o => o.id !== outfit.id))
        },
      },
    ])
  }

  const rows = savedLooks.reduce<SavedOutfit[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item])
    else acc[acc.length - 1].push(item)
    return acc
  }, [])

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>

      {/* Manual outfit picker modal */}
      <WardrobePicker
        visible={showPicker}
        wardrobe={wardrobe}
        selected={selectedIds}
        onToggle={handleToggleItem}
        onClose={() => { setShowPicker(false); setSelectedIds(new Set()) }}
        onSave={handleSaveManualOutfit}
        theme={theme}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── Header ─────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.title}>Outfits</Text>
          {weather ? (
            <View style={styles.weatherChip}>
              <Ionicons name="partly-sunny-outline" size={12} color={theme.textSecondary} />
              <Text style={styles.weatherText}>{weather}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Generate / action form ───────────────────── */}
        <View style={styles.formCard}>
          <TextInput
            style={styles.input}
            placeholder="What's the occasion?"
            placeholderTextColor={theme.textPlaceholder}
            value={occasion}
            onChangeText={setOccasion}
            returnKeyType="done"
          />

          {aiEnabled ? (
            // AI mode: single suggest button
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
          ) : (
            // No-AI mode: randomize + build manually
            <View style={styles.noAIButtons}>
              <TouchableOpacity
                style={[styles.generateBtn, styles.generateBtnHalf]}
                onPress={handleRandomize}
                activeOpacity={0.85}
              >
                <Ionicons name="shuffle-outline" size={16} color={theme.textOnAccent} />
                <Text style={styles.generateBtnText}>Randomize</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.generateBtn, styles.generateBtnHalf, styles.generateBtnOutline, { borderColor: theme.accent }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.85}
              >
                <Ionicons name="construct-outline" size={16} color={theme.accent} />
                <Text style={[styles.generateBtnText, { color: theme.accent }]}>Build Manually</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Suggestion card ───────────────────────────── */}
        {suggestion && (
          <View style={styles.suggestionCard}>
            {outfitItems.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.itemRow}>
                {outfitItems.map(item => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => router.push({ pathname: '/(tabs)/item/[id]', params: { id: item.id, name: item.name, category: item.category, emoji: item.emoji, photoUri: item.photoUri ?? '' } })}
                    activeOpacity={0.8}
                  >
                    {item.photoUri ? (
                      <Image source={{ uri: item.photoUri }} style={styles.itemPhoto} />
                    ) : (
                      <View style={[styles.itemEmoji, { backgroundColor: theme.surfaceTint }]}>
                        <Text style={styles.itemEmojiText}>{item.emoji}</Text>
                      </View>
                    )}
                    <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            <Text style={styles.suggestionText}>{suggestion.suggestion.replace(/\*\*(.*?)\*\*/g, '$1')}</Text>
            {suggestion.reason ? (
              <Text style={styles.reasonText}>{suggestion.reason.replace(/\*\*(.*?)\*\*/g, '$1')}</Text>
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
                  <OutfitCard key={outfit.id} outfit={outfit} theme={theme} onDelete={() => handleDeleteLook(outfit)} />
                ))}
                {row.length === 1 && <View style={{ width: CARD_WIDTH }} />}
              </View>
            ))}
          </View>
        )}

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
  screen: { flex: 1, backgroundColor: theme.background },
  scrollContent: { paddingHorizontal: Spacing.screen, paddingTop: 52 },

  header: { marginBottom: Spacing.xl, gap: Spacing.sm },
  title: { fontFamily: 'PlayfairDisplay_600SemiBold', fontSize: 30, color: theme.textPrimary },
  weatherChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: theme.surface, paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1, borderColor: theme.border,
  },
  weatherText: { ...Typography.styles.caption, color: theme.textSecondary },

  formCard: {
    backgroundColor: theme.surface, borderRadius: Radius.xl,
    padding: Spacing.base, gap: Spacing.md, borderWidth: 1, borderColor: theme.border,
    marginBottom: Spacing.base, ...Shadow.card,
  },
  input: {
    ...Typography.styles.body, color: theme.textPrimary,
    backgroundColor: theme.background, borderRadius: Radius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 12, borderWidth: 1, borderColor: theme.border,
  },
  generateBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: theme.accent, borderRadius: Radius.lg, paddingVertical: 14,
  },
  generateBtnDisabled: { opacity: 0.6 },
  generateBtnText: { ...Typography.styles.btnLabel, color: theme.textOnAccent },
  noAIButtons: { flexDirection: 'row', gap: Spacing.sm },
  generateBtnHalf: { flex: 1 },
  generateBtnOutline: {
    backgroundColor: 'transparent', borderWidth: 1.5,
  },

  itemRow: { gap: Spacing.sm, paddingBottom: Spacing.sm },
  itemCard: { width: 80, alignItems: 'center', gap: 6 },
  itemPhoto: { width: 80, height: 100, borderRadius: Radius.lg, resizeMode: 'cover' },
  itemEmoji: {
    width: 80, height: 100, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: theme.border,
  },
  itemEmojiText: { fontSize: 36 },
  itemName: { ...Typography.styles.caption, color: theme.textSecondary, textAlign: 'center', lineHeight: 14 },

  suggestionCard: {
    backgroundColor: theme.surface, borderRadius: Radius.xl, padding: Spacing.xl,
    borderWidth: 1, borderColor: theme.border, marginBottom: Spacing.xl, gap: Spacing.md, ...Shadow.lifted,
  },
  suggestionText: { fontFamily: 'PlayfairDisplay_400Regular', fontSize: 16, color: theme.textPrimary, lineHeight: 26 },
  reasonText: { ...Typography.styles.italic, color: theme.textSecondary },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: theme.accent, borderRadius: Radius.lg, paddingVertical: 12, marginTop: Spacing.sm,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...Typography.styles.btnLabelSm, color: theme.textOnAccent },
  dismissBtn: { alignItems: 'center', paddingVertical: 4 },
  dismissText: { ...Typography.styles.caption, color: theme.textSecondary },

  boardSection: { gap: Spacing.base },
  boardLabel: { ...Typography.styles.sectionLabel, color: theme.sectionLabel },
  boardHint: { ...Typography.styles.caption, color: theme.textSecondary, marginTop: -Spacing.sm, marginBottom: Spacing.sm },
  row: { flexDirection: 'row', gap: Spacing.base },
  emptyBoard: {
    alignItems: 'center', justifyContent: 'center', gap: Spacing.base,
    paddingTop: Spacing.xxl, paddingBottom: Spacing.xxl, opacity: 0.5,
  },
  emptyText: { ...Typography.styles.bodySmall, color: theme.textSecondary, textAlign: 'center' },
})
