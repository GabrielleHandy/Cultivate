import { useState, useEffect, useMemo } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import * as Location from 'expo-location'
import { loadWardrobe } from '@/utils/storage'
import { askWearIt } from '@/utils/claude'
import { getWeather } from '@/utils/weather'
import { WearItSuggestion } from '@/constants/types'
import { type Theme, Spacing, Radius, Typography, Shadow } from '@/constants/theme'
import { useTheme } from '@/contexts/ThemeContext'

export default function OutfitsScreen() {
  const { theme } = useTheme()
  const styles = useMemo(() => makeStyles(theme), [theme])
  const [suggestion, setSuggestion] = useState<WearItSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('')
  const [weather, setWeather] = useState('')

  useEffect(() => {
    (async () => {
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
        // Weather is a nice-to-have — fail silently
      }
    })()
  }, [])

  const handleAsk = async () => {
    setLoading(true)
    setSuggestion(null)
    try {
      const items = await loadWardrobe()
      if (items.length === 0) {
        setSuggestion({ suggestion: 'Add some clothes to your wardrobe first! 👗', reason: '' })
        return
      }
      const context = [
        occasion,
        weather ? `Weather: ${weather}` : ''
      ].filter(Boolean).join('. ')

      const result = await askWearIt(items, context)
      setSuggestion(result)
    } catch {
      setSuggestion({ suggestion: 'Something went wrong. Try again.', reason: '' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.screen}>

      {weather ? (
        <Text style={styles.weather}>🌤 {weather}</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="What's the occasion? (casual, date night, interview...)"
        placeholderTextColor={theme.textPlaceholder}
        value={occasion}
        onChangeText={setOccasion}
      />

      <TouchableOpacity style={styles.btn} onPress={handleAsk}>
        <Text style={styles.btnText}>✨ Suggest an Outfit</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color={theme.accent} style={{ marginTop: 24 }} />}

      {suggestion && (
        <View style={styles.card}>
          <Text style={styles.suggestionText}>
            {suggestion.suggestion.replace(/\*\*(.*?)\*\*/g, '$1')}
          </Text>
          {suggestion.reason ? (
            <Text style={styles.reasonText}>
              {suggestion.reason.replace(/\*\*(.*?)\*\*/g, '$1')}
            </Text>
          ) : null}
        </View>
      )}

    </View>
  )
}

const makeStyles = (theme: Theme) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.background,
    padding: Spacing.screen,
    paddingTop: 40,
  },
  weather: {
    ...Typography.styles.caption,
    color: theme.textSecondary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  input: {
    backgroundColor: theme.surface,
    borderRadius: Radius.md,
    padding: 14,
    ...Typography.styles.bodySmall,
    color: theme.textPrimary,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: theme.border,
  },
  btn: {
    backgroundColor: theme.accent,
    padding: Spacing.base,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  btnText: {
    ...Typography.styles.btnLabel,
    color: theme.textOnAccent,
  },
  card: {
    backgroundColor: theme.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: theme.borderSubtle,
    gap: Spacing.md,
    ...Shadow.card,
  },
  suggestionText: {
    ...Typography.styles.body,
    color: theme.textPrimary,
  },
  reasonText: {
    ...Typography.styles.italic,
    color: theme.textSecondary,
  },
})