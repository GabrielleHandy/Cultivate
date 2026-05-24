import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { router } from 'expo-router'
import { useState } from 'react'

export default function ClothingCard({ 
  id,
  name = 'Unnamed Clothing', 
  category = 'Unnamed Category', 
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
  const [selected, setSelected] = useState(false)

  return (
    <TouchableOpacity 
      style={[styles.card, selected && styles.selected]}
      onPress={() => router.push({
        pathname: '/(tabs)/item/[id]',
        params: { id, name, category, emoji, photoUri }
      })}
      onLongPress={() => setSelected(!selected)}
    >
      {photoUri ? (
        <Image 
          source={{ uri: photoUri }} 
          style={styles.photo} 
        />
      ) : (
        <Text style={styles.emoji}>{emoji}</Text>
      )}
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.category}>{category}</Text>
      {selected && <Text style={styles.check}>✓</Text>}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 4,
  },
  selected: {
    borderWidth: 2,
    borderColor: '#C97B5A',
    backgroundColor: '#FEF6F2',
  },
  photo: {
    width: 100,
    height: 130,
    borderRadius: 10,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  name: {
    fontWeight: '600',
    textAlign: 'center',
  },
  category: {
    color: '#8C5E4A',
    fontSize: 13,
    marginTop: 4,
  },
  check: {
    position: 'absolute',
    top: 10,
    right: 14,
    color: '#C97B5A',
    fontWeight: '700',
    fontSize: 16,
  }
})