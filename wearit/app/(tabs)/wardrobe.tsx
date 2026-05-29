import { useState, useCallback, useMemo } from 'react'
import {
  View, ScrollView, FlatList, Text, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, Image,
  TextInput, Dimensions, Modal, KeyboardAvoidingView, Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ClothingItem, ClothingCategoryOptions } from '@/constants/types'
import { addItem, loadWardrobe } from '../../utils/storage'
import { tagClothingItem } from '@/utils/claude'
import { useFocusEffect, router } from 'expo-router'
import { useImagePicker } from '@/hooks/useImagePicker'
import * as FileSystem from 'expo-file-system'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'
import { useAI } from '@/contexts/AIContext'

const CATEGORIES = ['Tops', 'Bottoms', 'Shoes', 'Dresses', 'Outerwear', 'Accessories', 'Other']
const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GRID_CARD = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.base) / 2

const CATEGORY_EMOJI: Record<string, string> = {
  Tops: '👕', Bottoms: '👖', Shoes: '👟',
  Dresses: '👗', Outerwear: '🧥', Accessories: '👜', Other: '🎽',
}

// ─── Color name → hex ──────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  black: '#1a1a1a', white: '#f5f5f5', grey: '#9e9e9e', gray: '#9e9e9e',
  red: '#e53935', pink: '#e91e8c', orange: '#f57c00', yellow: '#fdd835',
  green: '#43a047', teal: '#00897b', blue: '#1e88e5', navy: '#1a237e',
  purple: '#8e24aa', brown: '#6d4c41', beige: '#d7ccc8', cream: '#fff8e1',
  tan: '#c8a97e', khaki: '#bdb76b', olive: '#808000', burgundy: '#800020',
  coral: '#ff6b6b', lavender: '#b39ddb', gold: '#ffd700', silver: '#c0c0c0',
}

function colorToHex(colorName: string): string {
  const lower = colorName.toLowerCase()
  for (const [key, hex] of Object.entries(COLOR_HEX)) {
    if (lower.includes(key)) return hex
  }
  return '#aaaaaa'
}

// ─── Manual Tag Modal ─────────────────────────────────────────────────────
// Used when AI is off. Shows photo + form fields.

function ManualTagModal({
  visible,
  photoUri,
  batchInfo,
  theme,
  onSave,
  onCancel,
}: {
  visible: boolean
  photoUri: string | null
  batchInfo?: { current: number; total: number }
  theme: Theme
  onSave: (fields: { name: string; category: ClothingItem['category']; color: string }) => void
  onCancel: () => void
}) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ClothingItem['category']>('Tops')
  const [color, setColor] = useState('')

  const handleSave = () => {
    onSave({ name: name.trim() || 'New Item', category, color: color.trim() })
    setName('')
    setColor('')
    setCategory('Tops')
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.background }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={modalStyles.content}>

          {/* Header */}
          <View style={modalStyles.header}>
            <Text style={[modalStyles.title, { color: theme.textPrimary }]}>
              {batchInfo ? `Label Item ${batchInfo.current} of ${batchInfo.total}` : 'Label This Item'}
            </Text>
            {!batchInfo && (
              <TouchableOpacity onPress={onCancel} hitSlop={8}>
                <Ionicons name="close" size={22} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Photo preview */}
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={modalStyles.photo} resizeMode="cover" />
          ) : (
            <View style={[modalStyles.photoPlaceholder, { backgroundColor: theme.surfaceTint }]}>
              <Text style={{ fontSize: 48 }}>{CATEGORY_EMOJI[category]}</Text>
            </View>
          )}

          {/* Name */}
          <Text style={[modalStyles.label, { color: theme.textSecondary }]}>Name</Text>
          <TextInput
            style={[modalStyles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="e.g. White Linen Shirt"
            placeholderTextColor={theme.textPlaceholder}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />

          {/* Color */}
          <Text style={[modalStyles.label, { color: theme.textSecondary }]}>Color</Text>
          <TextInput
            style={[modalStyles.input, { color: theme.textPrimary, backgroundColor: theme.surface, borderColor: theme.border }]}
            placeholder="e.g. Navy Blue"
            placeholderTextColor={theme.textPlaceholder}
            value={color}
            onChangeText={setColor}
            autoCapitalize="words"
            returnKeyType="done"
          />

          {/* Category */}
          <Text style={[modalStyles.label, { color: theme.textSecondary }]}>Category</Text>
          <View style={modalStyles.pills}>
            {ClothingCategoryOptions.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[
                  modalStyles.pill,
                  { borderColor: theme.accent },
                  category === opt && { backgroundColor: theme.accent },
                ]}
                onPress={() => setCategory(opt as ClothingItem['category'])}
              >
                <Text style={[
                  modalStyles.pillText,
                  { color: theme.accent },
                  category === opt && { color: theme.textOnAccent },
                ]}>
                  {CATEGORY_EMOJI[opt]} {opt}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[modalStyles.saveBtn, { backgroundColor: theme.accent }]}
            onPress={handleSave}
          >
            <Text style={[modalStyles.saveBtnText, { color: theme.textOnAccent }]}>
              {batchInfo && batchInfo.current < batchInfo.total ? 'Save & Next →' : 'Save Item'}
            </Text>
          </TouchableOpacity>

          {batchInfo && (
            <TouchableOpacity style={modalStyles.skipBtn} onPress={onCancel}>
              <Text style={[modalStyles.skipText, { color: theme.textSecondary }]}>Cancel remaining</Text>
            </TouchableOpacity>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const modalStyles = StyleSheet.create({
  content: {
    padding: Spacing.screen,
    paddingTop: Spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
  },
  title: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 20,
  },
  photo: {
    width: '100%',
    height: 240,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xl,
  },
  photoPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  label: {
    ...Typography.styles.sectionLabel,
    marginBottom: Spacing.sm,
  },
  input: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: Spacing.xl,
    fontFamily: 'DMSans_400Regular',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  pillText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
  saveBtn: {
    borderRadius: Radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  saveBtnText: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 16,
    fontWeight: '600',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipText: {
    ...Typography.styles.caption,
  },
})

// ─── Compact photo card ────────────────────────────────────────────────────

function WardrobeCard({ item }: { item: ClothingItem }) {
  const { theme } = useTheme()
  const cardStyles = useMemo(() => makeCardStyles(theme), [theme])

  return (
    <TouchableOpacity
      style={cardStyles.card}
      onPress={() => router.push({ pathname: '/(tabs)/item/[id]', params: { id: item.id, name: item.name, category: item.category, emoji: item.emoji, photoUri: item.photoUri } })}
      activeOpacity={0.85}
    >
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={cardStyles.photo} />
      ) : (
        <View style={cardStyles.emojiBg}>
          <Text style={cardStyles.emoji}>{item.emoji}</Text>
        </View>
      )}
      <View style={cardStyles.overlay}>
        <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
        {item.needsTagging && (
          <View style={cardStyles.needsTagBadge}>
            <Text style={cardStyles.needsTagText}>Edit</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  )
}

const makeCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: 110,
    height: 148,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.surface,
    marginRight: Spacing.sm,
    ...Shadow.card,
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  emojiBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceTint,
  },
  emoji: { fontSize: 40 },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  name: {
    ...Typography.styles.caption,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },
  needsTagBadge: {
    backgroundColor: 'rgba(255,200,0,0.9)',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  needsTagText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#1a1a1a',
  },
})

// ─── Grid card ─────────────────────────────────────────────────────────────

function GridCard({ item, theme }: { item: ClothingItem; theme: Theme }) {
  const gridStyles = useMemo(() => makeGridCardStyles(theme), [theme])
  return (
    <TouchableOpacity
      style={gridStyles.card}
      onPress={() => router.push({ pathname: '/(tabs)/item/[id]', params: { id: item.id, name: item.name, category: item.category, emoji: item.emoji, photoUri: item.photoUri ?? '' } })}
      activeOpacity={0.85}
    >
      {item.photoUri ? (
        <Image source={{ uri: item.photoUri }} style={gridStyles.photo} />
      ) : (
        <View style={gridStyles.emojiBg}>
          <Text style={gridStyles.emoji}>{item.emoji}</Text>
        </View>
      )}
      <View style={gridStyles.info}>
        <Text style={gridStyles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={gridStyles.meta} numberOfLines={1}>{item.category}{item.color ? ` · ${item.color}` : ''}</Text>
      </View>
    </TouchableOpacity>
  )
}

const makeGridCardStyles = (theme: Theme) => StyleSheet.create({
  card: {
    width: GRID_CARD,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    backgroundColor: theme.surface,
    ...Shadow.card,
  },
  photo: { width: GRID_CARD, height: GRID_CARD * 1.3, resizeMode: 'cover' },
  emojiBg: {
    width: GRID_CARD,
    height: GRID_CARD * 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceTint,
  },
  emoji: { fontSize: 48 },
  info: { padding: Spacing.sm, gap: 2 },
  name: { ...Typography.styles.bodySmall, fontWeight: '600', color: theme.textPrimary },
  meta: { ...Typography.styles.caption, color: theme.textSecondary },
})

// ─── Empty state ───────────────────────────────────────────────────────────

function EmptyWardrobe({ onAdd }: { onAdd: () => void }) {
  const { theme } = useTheme()
  const emptyStyles = useMemo(() => makeEmptyStyles(theme), [theme])
  return (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>🪞</Text>
      <Text style={emptyStyles.title}>Your closet is waiting</Text>
      <Text style={emptyStyles.subtitle}>Add your first piece and let WearIt learn your style</Text>
      <TouchableOpacity style={emptyStyles.btn} onPress={onAdd}>
        <Text style={emptyStyles.btnText}>+ Add First Item</Text>
      </TouchableOpacity>
    </View>
  )
}

const makeEmptyStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl,
  },
  icon: { fontSize: 56, marginBottom: Spacing.base },
  title: { ...Typography.styles.screenTitle, color: theme.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.styles.bodySmall, color: theme.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  btn: { backgroundColor: theme.accent, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: Radius.lg },
  btnText: { ...Typography.styles.btnLabel, color: theme.textOnAccent },
})

// ─── Main screen ───────────────────────────────────────────────────────────

export default function WardrobeScreen() {
  const { theme } = useTheme()
  const { aiEnabled } = useAI()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tagging, setTagging] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null)
  const [query, setQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterColors, setFilterColors] = useState<string[]>([])
  const [showColorPicker, setShowColorPicker] = useState(false)

  // Manual tagging modal state
  const [manualQueue, setManualQueue] = useState<string[]>([])   // permanent URIs queued
  const [manualIndex, setManualIndex] = useState(0)
  const [showManualModal, setShowManualModal] = useState(false)

  const { takePhoto, pickFromLibrary, pickMultipleFromLibrary } = useImagePicker()

  const availableColors = useMemo(() => {
    const seen = new Set<string>()
    items.forEach(i => { if (i.color) seen.add(i.color) })
    return Array.from(seen).sort()
  }, [items])

  // Items that still need manual labeling
  const needsTaggingCount = useMemo(() => items.filter(i => i.needsTagging).length, [items])

  const saveImagePermanently = async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop()!
    const destPath = FileSystem.Paths.document.uri + filename
    const sourceFile = new FileSystem.File(uri)
    const destFile = new FileSystem.File(destPath)
    await sourceFile.copy(destFile)
    return destPath
  }

  // ── Manual save from modal ─────────────────────────────────────────────
  const handleManualSave = async (fields: { name: string; category: ClothingItem['category']; color: string }) => {
    const uri = manualQueue[manualIndex]
    const newItem = await addItem({
      name: fields.name,
      category: fields.category,
      emoji: CATEGORY_EMOJI[fields.category] ?? '👗',
      color: fields.color,
      photoUri: uri,
      addedAt: new Date().getTime().toString(),
      needsTagging: false,
    })
    setItems(prev => [...prev, newItem])

    const next = manualIndex + 1
    if (next < manualQueue.length) {
      setManualIndex(next)
    } else {
      setManualQueue([])
      setManualIndex(0)
      setShowManualModal(false)
    }
  }

  const handleManualCancel = () => {
    setManualQueue([])
    setManualIndex(0)
    setShowManualModal(false)
  }

  // ── Tag + save a single photo (AI path) ───────────────────────────────
  const tagAndSaveAI = async (permanentUri: string) => {
    const tag = await tagClothingItem(permanentUri)
    const newItem = await addItem({
      name: tag.name,
      category: tag.category,
      emoji: CATEGORY_EMOJI[tag.category] ?? '👗',
      color: tag.color,
      photoUri: permanentUri,
      addedAt: new Date().getTime().toString(),
      needsTagging: false,
    })
    setItems(prev => [...prev, newItem])
    return newItem
  }

  const processBatchAI = async (uris: string[]) => {
    for (let i = 0; i < uris.length; i++) {
      setBatchProgress({ current: i + 1, total: uris.length })
      try {
        await tagAndSaveAI(uris[i])
      } catch {
        // Skip failed items
      }
    }
    setBatchProgress(null)
  }

  // ── Add item handler ────────────────────────────────────────────────────
  const handleAddItem = async () => {
    Alert.alert('Add to Wardrobe', 'Where is the photo?', [
      {
        text: '📷 Take Photo',
        onPress: async () => {
          const uri = await takePhoto()
          if (!uri) return
          const permanentUri = await saveImagePermanently(uri)
          if (!aiEnabled) {
            setManualQueue([permanentUri])
            setManualIndex(0)
            setShowManualModal(true)
            return
          }
          setTagging(true)
          await tagAndSaveAI(permanentUri)
          setTagging(false)
        },
      },
      {
        text: '🖼️ Choose one',
        onPress: async () => {
          const uri = await pickFromLibrary()
          if (!uri) return
          const permanentUri = await saveImagePermanently(uri)
          if (!aiEnabled) {
            setManualQueue([permanentUri])
            setManualIndex(0)
            setShowManualModal(true)
            return
          }
          setTagging(true)
          await tagAndSaveAI(permanentUri)
          setTagging(false)
        },
      },
      {
        text: '📚 Select multiple',
        onPress: async () => {
          const uris = await pickMultipleFromLibrary()
          if (uris.length === 0) return
          const permanentUris = await Promise.all(uris.map(saveImagePermanently))
          if (!aiEnabled) {
            setManualQueue(permanentUris)
            setManualIndex(0)
            setShowManualModal(true)
            return
          }
          await processBatchAI(permanentUris)
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ])
  }

  useFocusEffect(
    useCallback(() => {
      loadWardrobe().then(saved => {
        setItems(saved)
        setLoading(false)
      })
    }, [])
  )

  const toggleColorFilter = (color: string) => {
    setFilterColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color])
  }

  const toggleCategoryFilter = (category: string) => {
    setFilterCategory(prev => prev === category ? null : category)
  }

  const clearAllFilters = () => {
    setQuery('')
    setFilterCategory(null)
    setFilterColors([])
    setShowColorPicker(false)
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  const q = query.toLowerCase().trim()
  const tokens = q.split(/\s+/).filter(Boolean)
  const isFiltered = q.length > 0 || filterCategory !== null || filterColors.length > 0

  const filteredItems = isFiltered
    ? items.filter(item => {
        if (tokens.length > 0) {
          const ok = tokens.every(token =>
            item.name.toLowerCase().includes(token) ||
            item.category.toLowerCase().includes(token) ||
            (item.color?.toLowerCase().includes(token) ?? false)
          )
          if (!ok) return false
        }
        if (filterCategory && item.category !== filterCategory) return false
        if (filterColors.length > 0 && !filterColors.includes(item.color ?? '')) return false
        return true
      })
    : []

  const filteredRows = filteredItems.reduce<ClothingItem[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item])
    else acc[acc.length - 1].push(item)
    return acc
  }, [])

  const categoriesWithItems = CATEGORIES
    .map(cat => ({ category: cat, items: items.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0)

  const hasActiveChips = filterCategory !== null || filterColors.length > 0

  return (
    <View style={styles.screen}>

      {/* Manual tagging modal */}
      <ManualTagModal
        visible={showManualModal}
        photoUri={manualQueue[manualIndex] ?? null}
        batchInfo={manualQueue.length > 1 ? { current: manualIndex + 1, total: manualQueue.length } : undefined}
        theme={theme}
        onSave={handleManualSave}
        onCancel={handleManualCancel}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Wardrobe</Text>
          <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem} disabled={tagging || !!batchProgress}>
          {tagging ? (
            <ActivityIndicator color={theme.textOnAccent} size='small' />
          ) : (
            <Text style={styles.addBtnText}>+ Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Needs-labeling banner */}
      {needsTaggingCount > 0 && (
        <TouchableOpacity
          style={[styles.needsTagBanner, { backgroundColor: theme.surfaceTint, borderColor: theme.border }]}
          onPress={() => {
            const pending = items.filter(i => i.needsTagging)
            if (pending[0]) {
              router.push({
                pathname: '/(tabs)/item/[id]',
                params: { id: pending[0].id, name: pending[0].name, category: pending[0].category, emoji: pending[0].emoji, photoUri: pending[0].photoUri ?? '' },
              })
            }
          }}
        >
          <Ionicons name="alert-circle-outline" size={16} color={theme.accent} />
          <Text style={[styles.needsTagText, { color: theme.textPrimary }]}>
            {needsTaggingCount} item{needsTaggingCount !== 1 ? 's' : ''} need labeling
          </Text>
          <Ionicons name="chevron-forward" size={14} color={theme.textSecondary} />
        </TouchableOpacity>
      )}

      {/* Search bar + filter icon */}
      {items.length > 0 && (
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={theme.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, color, or category…"
            placeholderTextColor={theme.textPlaceholder}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="never"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
          {availableColors.length > 0 && (
            <TouchableOpacity
              onPress={() => setShowColorPicker(prev => !prev)}
              hitSlop={8}
              style={[styles.funnelBtn, showColorPicker && styles.funnelBtnActive]}
            >
              <Ionicons name="filter" size={16} color={showColorPicker || filterColors.length > 0 ? theme.accent : theme.textSecondary} />
              {filterColors.length > 0 && (
                <View style={[styles.funnelBadge, { backgroundColor: theme.accent }]}>
                  <Text style={[styles.funnelBadgeText, { color: theme.textOnAccent }]}>{filterColors.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Color picker dropdown */}
      {showColorPicker && availableColors.length > 0 && (
        <View style={[styles.colorPicker, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.colorPickerLabel, { color: theme.textSecondary }]}>Filter by color</Text>
          <View style={styles.colorDots}>
            {availableColors.map(color => {
              const active = filterColors.includes(color)
              return (
                <TouchableOpacity key={color} style={styles.colorOption} onPress={() => toggleColorFilter(color)} activeOpacity={0.7}>
                  <View style={[styles.colorDot, { backgroundColor: colorToHex(color) }, active && styles.colorDotActive]}>
                    {active && <Ionicons name="checkmark" size={10} color="#fff" />}
                  </View>
                  <Text style={[styles.colorDotLabel, { color: active ? theme.accent : theme.textSecondary }]} numberOfLines={1}>{color}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>
      )}

      {/* Active filter chips */}
      {hasActiveChips && (
        <View style={styles.chipsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsScroll}>
            {filterCategory && (
              <TouchableOpacity style={[styles.chip, { backgroundColor: theme.accent }]} onPress={() => setFilterCategory(null)} activeOpacity={0.7}>
                <Text style={[styles.chipText, { color: theme.textOnAccent }]}>{CATEGORY_EMOJI[filterCategory]} {filterCategory}</Text>
                <Ionicons name="close" size={12} color={theme.textOnAccent} style={styles.chipX} />
              </TouchableOpacity>
            )}
            {filterColors.map(color => (
              <TouchableOpacity key={color} style={[styles.chip, { backgroundColor: theme.accent }]} onPress={() => toggleColorFilter(color)} activeOpacity={0.7}>
                <View style={[styles.chipColorDot, { backgroundColor: colorToHex(color) }]} />
                <Text style={[styles.chipText, { color: theme.textOnAccent }]}>{color}</Text>
                <Ionicons name="close" size={12} color={theme.textOnAccent} style={styles.chipX} />
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={[styles.chip, styles.chipClear, { borderColor: theme.border }]} onPress={clearAllFilters} activeOpacity={0.7}>
              <Text style={[styles.chipText, { color: theme.textSecondary }]}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Tagging / batch progress banner */}
      {(tagging || batchProgress) && (
        <View style={[styles.taggingBanner, { backgroundColor: theme.surfaceTint, borderColor: theme.border }]}>
          <ActivityIndicator color={theme.accent} size='small' />
          <Text style={[styles.taggingText, { color: theme.textSecondary }]}>
            {batchProgress ? `Tagging ${batchProgress.current} of ${batchProgress.total}…` : 'Claude is tagging your item…'}
          </Text>
          {batchProgress && (
            <View style={[styles.batchBar, { backgroundColor: theme.border }]}>
              <View style={[styles.batchBarFill, { backgroundColor: theme.accent, width: `${(batchProgress.current / batchProgress.total) * 100}%` as any }]} />
            </View>
          )}
        </View>
      )}

      {/* Content */}
      {items.length === 0 ? (
        <EmptyWardrobe onAdd={handleAddItem} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {isFiltered ? (
            filteredItems.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={32} color={theme.border} />
                <Text style={styles.noResultsText}>No items match your filters</Text>
                <TouchableOpacity onPress={clearAllFilters}>
                  <Text style={[styles.clearFiltersLink, { color: theme.accent }]}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.gridSection}>
                <Text style={styles.sectionLabel}>{filteredItems.length} result{filteredItems.length !== 1 ? 's' : ''}</Text>
                {filteredRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {row.map(item => <GridCard key={item.id} item={item} theme={theme} />)}
                    {row.length === 1 && <View style={{ width: GRID_CARD }} />}
                  </View>
                ))}
              </View>
            )
          ) : (
            categoriesWithItems.map(({ category, items: catItems }) => (
              <View key={category} style={styles.section}>
                <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleCategoryFilter(category)} activeOpacity={0.6}>
                  <Text style={[styles.sectionLabel, filterCategory === category && { color: theme.accent }]}>
                    {CATEGORY_EMOJI[category]} {category.toUpperCase()}
                  </Text>
                  <View style={styles.sectionHeaderRight}>
                    <Text style={styles.sectionCount}>{catItems.length}</Text>
                    <Ionicons name="chevron-forward" size={12} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                  </View>
                </TouchableOpacity>
                <FlatList
                  data={catItems}
                  keyExtractor={item => item.id}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.cardRow}
                  renderItem={({ item }) => <WardrobeCard item={item} />}
                />
              </View>
            ))
          )}

          <View style={{ height: Spacing.xxl }} />
        </ScrollView>
      )}
    </View>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.background },
  center: { flex: 1, backgroundColor: theme.background, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, paddingTop: 52, paddingBottom: Spacing.base,
    backgroundColor: theme.background,
  },
  title: { ...Typography.styles.screenTitle, color: theme.textPrimary },
  subtitle: { ...Typography.styles.caption, color: theme.textSecondary, marginTop: 2 },
  addBtn: {
    backgroundColor: theme.accent, paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, minWidth: 64, alignItems: 'center',
  },
  addBtnText: { ...Typography.styles.btnLabelSm, color: theme.textOnAccent },
  needsTagBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.screen, marginBottom: Spacing.sm,
    padding: Spacing.md, borderRadius: Radius.md, borderWidth: 1,
  },
  needsTagText: { ...Typography.styles.bodySmall, flex: 1, fontWeight: '500' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.screen, marginBottom: Spacing.sm,
    backgroundColor: theme.surface, borderRadius: Radius.lg, borderWidth: 1,
    borderColor: theme.border, paddingHorizontal: Spacing.md, height: 42, gap: Spacing.sm,
  },
  searchIcon: { flexShrink: 0 },
  searchInput: { flex: 1, ...Typography.styles.bodySmall, color: theme.textPrimary, paddingVertical: 0 },
  funnelBtn: { padding: 4, position: 'relative' },
  funnelBtnActive: { opacity: 1 },
  funnelBadge: { position: 'absolute', top: 0, right: 0, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  funnelBadgeText: { fontSize: 8, fontWeight: '700' },
  colorPicker: {
    marginHorizontal: Spacing.screen, marginBottom: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, gap: Spacing.sm,
  },
  colorPickerLabel: { ...Typography.styles.caption, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  colorDots: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  colorOption: { alignItems: 'center', gap: 4, width: 44 },
  colorDot: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  colorDotActive: { borderColor: theme.accent },
  colorDotLabel: { fontSize: 9, textAlign: 'center', lineHeight: 11 },
  chipsRow: { marginBottom: Spacing.sm },
  chipsScroll: { paddingHorizontal: Spacing.screen, gap: Spacing.sm, flexDirection: 'row', alignItems: 'center' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, gap: 4 },
  chipClear: { backgroundColor: 'transparent', borderWidth: 1 },
  chipColorDot: { width: 10, height: 10, borderRadius: 5 },
  chipText: { ...Typography.styles.caption, fontWeight: '600' },
  chipX: { marginLeft: 2 },
  taggingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.screen, marginBottom: Spacing.sm,
    padding: Spacing.sm, borderRadius: Radius.md, borderWidth: 1,
  },
  taggingText: { ...Typography.styles.bodySmall, flex: 1 },
  batchBar: { height: 3, borderRadius: 2, overflow: 'hidden', flex: 1, minWidth: 60 },
  batchBarFill: { height: '100%', borderRadius: 2 },
  noResults: { alignItems: 'center', justifyContent: 'center', paddingTop: Spacing.xxl, gap: Spacing.base, opacity: 0.6 },
  noResultsText: { ...Typography.styles.bodySmall, color: theme.textSecondary, textAlign: 'center' },
  clearFiltersLink: { ...Typography.styles.bodySmall, fontWeight: '600' },
  gridSection: { paddingHorizontal: Spacing.screen, gap: Spacing.base },
  gridRow: { flexDirection: 'row', gap: Spacing.base },
  scrollContent: { paddingTop: Spacing.sm },
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen, marginBottom: Spacing.sm,
  },
  sectionHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sectionLabel: { ...Typography.styles.sectionLabel, color: theme.sectionLabel },
  sectionCount: { ...Typography.styles.caption, color: theme.textSecondary },
  cardRow: { paddingHorizontal: Spacing.screen },
})
