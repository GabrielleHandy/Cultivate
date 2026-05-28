import { ClothingItem, ClothingCategoryOptions } from '@/constants/types'
import { deleteItem, loadWardrobe, updateItem } from '@/utils/storage'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useState, useCallback, useMemo } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  Image, TextInput, Alert, ScrollView, Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const PHOTO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.52)

// ─── Category pill ─────────────────────────────────────────────────────────

function CategoryPill({
  option, selected, theme, onPress,
}: {
  option: string
  selected: boolean
  theme: Theme
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        pillStyles.pill,
        { borderColor: theme.accent },
        selected && { backgroundColor: theme.accent },
      ]}
    >
      <Text style={[
        pillStyles.text,
        { color: theme.accent },
        selected && { color: theme.textOnAccent },
      ]}>
        {option}
      </Text>
    </TouchableOpacity>
  )
}

const pillStyles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1.5,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'DMSans_500Medium',
  },
})

// ─── Action button ──────────────────────────────────────────────────────────

function ActionBtn({
  icon, label, onPress, danger = false, theme,
}: {
  icon: keyof typeof Ionicons.glyphMap
  label: string
  onPress: () => void
  danger?: boolean
  theme: Theme
}) {
  return (
    <TouchableOpacity style={actionStyles.btn} onPress={onPress} activeOpacity={0.7}>
      <View style={[
        actionStyles.iconWrap,
        { backgroundColor: danger ? theme.accentDanger + '15' : theme.surfaceTint },
      ]}>
        <Ionicons
          name={icon}
          size={20}
          color={danger ? theme.accentDanger : theme.accent}
        />
      </View>
      <Text style={[actionStyles.label, { color: danger ? theme.accentDanger : theme.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  )
}

const actionStyles = StyleSheet.create({
  btn: { alignItems: 'center', gap: 6, flex: 1 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    textAlign: 'center',
  },
})

// ─── Main screen ────────────────────────────────────────────────────────────

export default function ItemDetail() {
  const { theme } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const insets = useSafeAreaInsets()

  const { id, name, category, emoji, photoUri } = useLocalSearchParams()

  const [editMode, setEditMode] = useState(false)
  const [selectedName, setSelectedName] = useState(name as string)
  const [selectedCategory, setSelectedCategory] = useState(category as string)
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(photoUri as string | undefined)
  const [changesMade, setChangesMade] = useState(false)

  // Reload from storage whenever this screen focuses — catches edits made elsewhere
  useFocusEffect(
    useCallback(() => {
      loadWardrobe().then(items => {
        const item = items.find(i => i.id === id)
        if (!item) return
        setSelectedName(item.name)
        setSelectedCategory(item.category)
        setSelectedPhotoUri(item.photoUri)
      })
    }, [id])
  )

  const updateName = (value: string) => {
    setSelectedName(value)
    setChangesMade(value !== name || selectedCategory !== category)
  }

  const updateCategory = (value: string) => {
    setSelectedCategory(value)
    setChangesMade(selectedName !== name || value !== category)
  }

  const handleSave = async () => {
    await updateItem({
      id: id as string,
      name: selectedName,
      category: selectedCategory as ClothingItem['category'],
      emoji: emoji as string,
      photoUri: selectedPhotoUri,
      addedAt: new Date().toISOString(),
      worn: 0,
    })
    setEditMode(false)
    setChangesMade(false)
  }

  const handleDelete = () => {
    Alert.alert(
      'Remove from wardrobe',
      `Remove "${selectedName}"? This can't be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await deleteItem(id as string)
            router.back()
          },
        },
      ]
    )
  }

  const handleAddToOutfit = () => {
    // Navigates to Outfits tab — will pass item context once saved board (Task #3) is built
    router.push('/(tabs)/outfits')
  }

  const handleFindSimilar = () => {
    Alert.alert(
      'Find Similar',
      'Coming soon — WearIt will scan your closet and suggest pieces that pair with this item.',
      [{ text: 'Got it' }]
    )
  }

  const handleRemoveBackground = () => {
    Alert.alert(
      'Remove Background',
      'This feature needs a remove.bg API key. Add it in Profile → AI Model Settings.',
      [
        { text: 'Later', style: 'cancel' },
        { text: 'Go to Profile', onPress: () => router.push('/(tabs)/profile') },
      ]
    )
  }

  return (
    <View style={[styles.screen, { paddingBottom: insets.bottom }]}>

      {/* ── Full-bleed photo ────────────────────────────── */}
      <View style={styles.photoContainer}>
        {selectedPhotoUri ? (
          <Image source={{ uri: selectedPhotoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderEmoji}>{emoji}</Text>
          </View>
        )}

        {/* Gradient scrim so back button is readable on any photo */}
        <View style={styles.photoScrim} />

        {/* Back button */}
        <TouchableOpacity
          style={[styles.backBtn, { top: insets.top + 8 }]}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Remove background — top right */}
        {selectedPhotoUri && (
          <TouchableOpacity
            style={[styles.bgRemoveBtn, { top: insets.top + 8 }]}
            onPress={handleRemoveBackground}
            activeOpacity={0.8}
          >
            <Ionicons name="cut-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Info panel ──────────────────────────────────── */}
      <ScrollView
        style={styles.panel}
        contentContainerStyle={styles.panelContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Name */}
        {editMode ? (
          <TextInput
            style={[styles.nameInput, { color: theme.textPrimary, borderBottomColor: theme.accent }]}
            value={selectedName}
            onChangeText={updateName}
            placeholder="Item name"
            placeholderTextColor={theme.textPlaceholder}
            autoFocus
          />
        ) : (
          <Text style={styles.name}>{selectedName}</Text>
        )}

        {/* Category */}
        {editMode ? (
          <View style={styles.categoryGrid}>
            {ClothingCategoryOptions.map(option => (
              <CategoryPill
                key={option}
                option={option}
                selected={selectedCategory === option}
                theme={theme}
                onPress={() => updateCategory(option)}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.category}>{selectedCategory}</Text>
        )}

        {/* Save button — only visible in edit mode with unsaved changes */}
        {editMode && changesMade && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark" size={16} color={theme.textOnAccent} />
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        {/* Action row */}
        <View style={styles.actions}>
          <ActionBtn
            icon={editMode ? 'close-outline' : 'pencil-outline'}
            label={editMode ? 'Cancel' : 'Edit'}
            onPress={() => { setEditMode(!editMode); setChangesMade(false) }}
            theme={theme}
          />
          <ActionBtn
            icon="layers-outline"
            label="Add to Outfit"
            onPress={handleAddToOutfit}
            theme={theme}
          />
          <ActionBtn
            icon="search-outline"
            label="Find Similar"
            onPress={handleFindSimilar}
            theme={theme}
          />
          <ActionBtn
            icon="trash-outline"
            label="Delete"
            onPress={handleDelete}
            danger
            theme={theme}
          />
        </View>
      </ScrollView>

    </View>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
  },

  // ── Photo ────────────────────────────────────────────────
  photoContainer: {
    width: '100%',
    height: PHOTO_HEIGHT,
    backgroundColor: theme.surface,
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.surfaceTint,
  },
  placeholderEmoji: {
    fontSize: 96,
  },
  // Thin gradient scrim at top so buttons are legible on bright photos
  photoScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  backBtn: {
    position: 'absolute',
    left: Spacing.base,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgRemoveBtn: {
    position: 'absolute',
    right: Spacing.base,
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Info panel ───────────────────────────────────────────
  panel: {
    flex: 1,
    backgroundColor: theme.background,
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    marginTop: -Radius.xl,   // pulls panel up to overlap photo bottom
  },
  panelContent: {
    padding: Spacing.screen,
    paddingTop: Spacing.xl,
  },
  name: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 26,
    color: theme.textPrimary,
    marginBottom: 6,
  },
  nameInput: {
    fontFamily: 'PlayfairDisplay_600SemiBold',
    fontSize: 24,
    borderBottomWidth: 2,
    paddingVertical: 6,
    marginBottom: 12,
  },
  category: {
    ...Typography.styles.bodySmall,
    color: theme.textSecondary,
    marginBottom: Spacing.xl,
    textTransform: 'capitalize',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.base,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: theme.accent,
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadow.card,
  },
  saveBtnText: {
    ...Typography.styles.btnLabelSm,
    color: theme.textOnAccent,
  },
  divider: {
    height: 1,
    backgroundColor: theme.border,
    marginVertical: Spacing.xl,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})
