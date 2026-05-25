import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { router } from 'expo-router'
import { useState, useMemo } from 'react'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

export default function ClothingCard({
  id,
  name = 'Unnamed Item',
  category = 'Other',
  emoji = '👗',
  photoUri,
  addedAt,
}: {
  id: string
  name?: string
  category?: string
  emoji?: string
  photoUri?: string
  addedAt?: string
}) {
  const { theme } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const [selected, setSelected] = useState(false)

  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.selected]}
      onPress={() => router.push({
        pathname: '/(tabs)/item/[id]',
        params: { id, name, category, emoji, photoUri },
      })}
      onLongPress={() => setSelected(!selected)}
      activeOpacity={0.85}
    >
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={styles.photo} />
      ) : (
        <View style={styles.emojiBg}>
          <Text style={styles.emoji}>{emoji}</Text>
        </View>
      )}

      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.category}>{category}</Text>

      {selected && (
        <View style={styles.checkBadge}>
          <Text style={styles.check}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.base,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.border,
    ...Shadow.card,
  },
  selected: {
    borderWidth: 2,
    borderColor: theme.accent,
    backgroundColor: theme.surfaceTint,
  },
  photo: {
    width: 100,
    height: 130,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    resizeMode: 'cover',
  },
  emojiBg: {
    width: 100,
    height: 130,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
    backgroundColor: theme.surfaceTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  name: {
    ...Typography.styles.bodySmall,
    fontWeight: '600',
    color: theme.textPrimary,
    textAlign: 'center',
  },
  category: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    marginTop: Spacing.xs,
  },
  checkBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 22,
    height: 22,
    borderRadius: Radius.full,
    backgroundColor: theme.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    color: theme.textOnAccent,
    fontWeight: '700',
    fontSize: 12,
  },
})
