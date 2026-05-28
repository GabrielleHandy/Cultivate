import { useState, useCallback, useMemo } from 'react'
import {
  View, ScrollView, FlatList, Text, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, Image,
  TextInput, Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ClothingItem } from '@/constants/types'
import { addItem, loadWardrobe } from '../../utils/storage'
import { tagClothingItem } from '@/utils/claude'
import { useFocusEffect, router } from 'expo-router'
import { useImagePicker } from '@/hooks/useImagePicker'
import * as FileSystem from 'expo-file-system'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

const CATEGORIES = ['Tops', 'Bottoms', 'Shoes', 'Dresses', 'Outerwear', 'Accessories', 'Other']
const { width: SCREEN_WIDTH } = Dimensions.get('window')
const GRID_CARD = (SCREEN_WIDTH - Spacing.screen * 2 - Spacing.base) / 2

const CATEGORY_EMOJI: Record<string, string> = {
  Tops: '👕', Bottoms: '👖', Shoes: '👟',
  Dresses: '👗', Outerwear: '🧥', Accessories: '👜', Other: '🎽',
}

// ─── Compact photo card for horizontal scroll ──────────────────────────────

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
      {/* Name overlay at bottom */}
      <View style={cardStyles.overlay}>
        <Text style={cardStyles.name} numberOfLines={1}>{item.name}</Text>
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
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  emojiBg: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceTint,
  },
  emoji: {
    fontSize: 40,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.52)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  name: {
    ...Typography.styles.caption,
    color: '#FFFFFF',
    fontWeight: '600',
  },
})

// ─── Grid card (used in search results) ────────────────────────────────────
// WardrobeCard is sized for horizontal scroll (110px wide).
// GridCard fills half the screen width for the 2-col search results grid.

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
  photo: {
    width: GRID_CARD,
    height: GRID_CARD * 1.3,
    resizeMode: 'cover',
  },
  emojiBg: {
    width: GRID_CARD,
    height: GRID_CARD * 1.3,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceTint,
  },
  emoji: { fontSize: 48 },
  info: {
    padding: Spacing.sm,
    gap: 2,
  },
  name: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: theme.textPrimary,
  },
  meta: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
  },
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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
  },
  icon: { fontSize: 56, marginBottom: Spacing.base },
  title: {
    ...Typography.styles.screenTitle,
    color: theme.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  btn: {
    backgroundColor: theme.accent,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  btnText: {
    ...Typography.styles.btnLabel,
    color: theme.textOnAccent,
  },
})

// ─── Main screen ───────────────────────────────────────────────────────────

export default function WardrobeScreen() {
  const { theme } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tagging, setTagging] = useState(false)
  const [query, setQuery] = useState('')
  const { takePhoto, pickFromLibrary } = useImagePicker()

  const saveImagePermanently = async (uri: string): Promise<string> => {
    const filename = uri.split('/').pop()!
    const destPath = FileSystem.Paths.document.uri + filename
    const sourceFile = new FileSystem.File(uri)
    const destFile = new FileSystem.File(destPath)
    await sourceFile.copy(destFile)
    return destPath
  }

  const handleAddItem = async () => {
    Alert.alert('Add to Wardrobe', 'Where is the photo?', [
      {
        text: '📷 Take Photo',
        onPress: async () => {
          const uri = await takePhoto()
          if (!uri) return
          const permanentUri = await saveImagePermanently(uri)
          setTagging(true)
          const tag = await tagClothingItem(permanentUri)
          const newItem = await addItem({
            name: tag.name,
            category: tag.category,
            emoji: CATEGORY_EMOJI[tag.category] ?? '👗',
            color: tag.color,
            photoUri: permanentUri,
            addedAt: new Date().getTime().toString(),
          })
          setItems(prev => [...prev, newItem])
          setTagging(false)
        },
      },
      {
        text: '🖼️ Choose from Library',
        onPress: async () => {
          const uri = await pickFromLibrary()
          if (!uri) return
          const permanentUri = await saveImagePermanently(uri)
          setTagging(true)
          const tag = await tagClothingItem(permanentUri)
          const newItem = await addItem({
            name: tag.name,
            category: tag.category,
            emoji: CATEGORY_EMOJI[tag.category] ?? '👗',
            color: tag.color,
            photoUri: permanentUri,
            addedAt: new Date().getTime().toString(),
          })
          setItems(prev => [...prev, newItem])
          setTagging(false)
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    )
  }

  // Category rows — only categories that have items
  const categoriesWithItems = CATEGORIES
    .map(cat => ({ category: cat, items: items.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0)

  // Search — filter client-side from already-loaded items, instant, no async needed
  const q = query.toLowerCase().trim()
  const searchResults = q
    ? items.filter(item =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.color?.toLowerCase().includes(q) ?? false)
      )
    : []

  // Chunk search results into rows of 2 for grid display.
  // Can't nest FlatList inside ScrollView — use manual pair chunking instead.
  const searchRows = searchResults.reduce<ClothingItem[][]>((acc, item, i) => {
    if (i % 2 === 0) acc.push([item])
    else acc[acc.length - 1].push(item)
    return acc
  }, [])

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Wardrobe</Text>
          <Text style={styles.subtitle}>{items.length} {items.length === 1 ? 'piece' : 'pieces'}</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAddItem} disabled={tagging}>
          {tagging ? (
            <ActivityIndicator color={theme.textOnAccent} size='small' />
          ) : (
            <Text style={styles.addBtnText}>+ Add</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search bar */}
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
        </View>
      )}

      {tagging && (
        <View style={styles.taggingBanner}>
          <ActivityIndicator color={theme.accent} size='small' />
          <Text style={styles.taggingText}>Claude is tagging your item...</Text>
        </View>
      )}

      {/* Content */}
      {items.length === 0 ? (
        <EmptyWardrobe onAdd={handleAddItem} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">

          {/* ── Search results ──────────────────────────── */}
          {q ? (
            searchResults.length === 0 ? (
              <View style={styles.noResults}>
                <Ionicons name="search-outline" size={32} color={theme.border} />
                <Text style={styles.noResultsText}>No items match "{query}"</Text>
              </View>
            ) : (
              <View style={styles.gridSection}>
                <Text style={styles.sectionLabel}>{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</Text>
                {searchRows.map((row, rowIdx) => (
                  <View key={rowIdx} style={styles.gridRow}>
                    {row.map(item => (
                      <GridCard key={item.id} item={item} theme={theme} />
                    ))}
                    {row.length === 1 && <View style={{ width: GRID_CARD }} />}
                  </View>
                ))}
              </View>
            )
          ) : (
            /* ── Category rows (default view) ─────────── */
            categoriesWithItems.map(({ category, items: catItems }) => (
              <View key={category} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionLabel}>
                    {CATEGORY_EMOJI[category]} {category.toUpperCase()}
                  </Text>
                  <Text style={styles.sectionCount}>{catItems.length}</Text>
                </View>
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
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },
  center: {
    flex: 1,
    backgroundColor: theme.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    paddingTop: 52,
    paddingBottom: Spacing.base,
    backgroundColor: theme.background,
  },
  title: {
    ...Typography.styles.screenTitle,
    color: theme.textPrimary,
  },
  subtitle: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: theme.accent,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minWidth: 64,
    alignItems: 'center',
  },
  addBtnText: {
    ...Typography.styles.btnLabelSm,
    color: theme.textOnAccent,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    backgroundColor: theme.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: theme.border,
    paddingHorizontal: Spacing.md,
    height: 42,
    gap: Spacing.sm,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    ...Typography.styles.bodySmall,
    color: theme.textPrimary,
    paddingVertical: 0,
  },
  noResults: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
    gap: Spacing.base,
    opacity: 0.5,
  },
  noResultsText: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
    textAlign: 'center',
  },
  gridSection: {
    gap: Spacing.base,
  },
  gridRow: {
    flexDirection: 'row',
    gap: Spacing.base,
  },
  taggingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
    backgroundColor: theme.surfaceTint,
    padding: Spacing.sm,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: theme.border,
  },
  taggingText: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
  },
  scrollContent: {
    paddingTop: Spacing.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screen,
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    ...Typography.styles.sectionLabel,
    color: theme.sectionLabel,
  },
  sectionCount: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
  },
  cardRow: {
    paddingHorizontal: Spacing.screen,
  },
})
