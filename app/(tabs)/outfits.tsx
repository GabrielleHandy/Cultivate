import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { loadWardrobe } from '@/utils/storage'
import { askWearIt } from '@/utils/claude'
import { WearItSuggestion } from '@/constants/types'

const WEATHER_KEY = process.env.EXPO_PUBLIC_WEATHER_KEY

async function getWeather(city: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_KEY}&units=imperial`
    )
    const data = await res.json()
    const temp = Math.round(data.main.temp)
    const desc = data.weather[0].description
    return `${temp}°F, ${desc}`
  } catch {
    return ''
  }
}

export default function OutfitsScreen() {
  const [suggestion, setSuggestion] = useState<WearItSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [occasion, setOccasion] = useState('')
  const [weather, setWeather] = useState('')

  useEffect(() => {
    // Get weather for Winston-Salem on load
    getWeather('Winston-Salem').then(setWeather)
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
        <Text style={styles.weather}>🌤 {weather} · Winston-Salem</Text>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="What's the occasion? (casual, date night, interview...)"
        placeholderTextColor="#C4A898"
        value={occasion}
        onChangeText={setOccasion}
      />

      <TouchableOpacity style={styles.btn} onPress={handleAsk}>
        <Text style={styles.btnText}>✨ Suggest an Outfit</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color='#C97B5A' style={{ marginTop: 24 }} />}

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    padding: 20,
    paddingTop: 40,
  },
  weather: {
    fontSize: 12,
    color: '#8C5E4A',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#2C1F1A',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(44,31,26,0.1)',
  },
  btn: {
    backgroundColor: '#C97B5A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 24,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(44,31,26,0.08)',
    gap: 12,
  },
  suggestionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2C1F1A',
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#8C5E4A',
    fontStyle: 'italic',
  }
})