import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import {askWearIt, getOutfitSuggestion } from '../../utils/claude'
import { loadWardrobe } from '@/utils/storage'

export default function OutfitsScreen() {
  const [suggestion, setSuggestion] = useState('')
  const [loading, setLoading] = useState(false)

  //Make weather accuracy a thing.
const handleAsk = async () => {
  setLoading(true)
  setSuggestion('')
  try {
    const items = await loadWardrobe()
    if (items.length === 0) {
      setSuggestion('Add some clothes to your wardrobe first! 👗')
      return
    }
    const response = await askWearIt(items)
    setSuggestion(response.replace(/\*\*(.*?)\*\*/g, '$1'))
  } catch (error) {
    setSuggestion('Something went wrong. Check your connection and try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <View style={styles.screen}>
      <TouchableOpacity style={styles.btn} onPress={handleAsk}>
        <Text style={styles.btnText}>✨ Suggest an Outfit</Text>
      </TouchableOpacity>

      {loading && <ActivityIndicator color='#C97B5A' style={{ marginTop: 24 }} />}

      {suggestion ? (
        <View style={styles.responseCard}>
          <Text style={styles.responseText}>{suggestion}</Text>
        </View>
      ) : null}
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
  btn: {
    backgroundColor: '#C97B5A',
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  responseCard: {
    marginTop: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(44,31,26,0.08)',
  },
  responseText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#2C1F1A',
  }
})