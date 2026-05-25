import { useState, useCallback, useMemo } from 'react'
import {
  View, ScrollView, FlatList, Text, StyleSheet,
  TouchableOpacity, Alert, ActivityIndicator, Image,
} from 'react-native'
import { ClothingItem } from '@/constants/types'
import { addItem, loadWardrobe } from '../../utils/storage'
import { tagClothingItem } from '@/utils/claude'
import { useFocusEffect, router } from 'expo-router'
import { useImagePicker } from '@/hooks/useImagePicker'
import * as FileSystem from 'expo-file-system'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

const CATEGORIES = ['Tops', 'Bottoms', 'Shoes', 'Dresses', 'Outerwear', 'Accessories', 'Other']

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
    backgroundColor: 'rgba(44,31,26,0.52)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
  },
  name: {
    ...Typography.styles.caption,
    color: '#FFFFFF',
    fontWeight: '600',
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

  // Group items by category, only include categories that have items
  const categoriesWithItems = CATEGORIES
    .map(cat => ({ category: cat, items: items.filter(i => i.category === cat) }))
    .filter(g => g.items.length > 0)

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
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {categoriesWithItems.map(({ category, items: catItems }) => (
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
          ))}
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
