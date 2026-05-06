import { useState, useEffect, useCallback } from 'react'
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import ClothingCard from '@/components/ClothingCard'
import { ClothingItem } from '@/constants/types'
import { addItem, loadWardrobe } from '../../utils/storage'
import { useFocusEffect } from 'expo-router'
import { useImagePicker } from '@/hooks/useImagePicker'
import * as FileSystem from 'expo-file-system'



export default function WardrobeScreen() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const addTime = new Date().getTime().toString()
  const { takePhoto, pickFromLibrary } = useImagePicker()

  const saveImagePermanently = async (uri: string): Promise<string> => {
  const filename = uri.split('/').pop()
  const dest = `${FileSystem.Paths.document}/${filename}`
  await FileSystem.copyAsync({ from: uri, to: dest })
  return dest
}
  const handleAddItem = async () => {
  Alert.alert('Add Clothing', 'Where would you like to add from?', [
    {
  text: '📷 Take Photo',
  onPress: async () => {
    const uri = await takePhoto()
    if (!uri) return
    const permanentUri = await saveImagePermanently(uri)
    const newItem = await addItem({
      name: 'New Item',
      category: 'Tops',
      emoji: '👕',
      photoUri: permanentUri,
      addedAt: addTime,
    })
    setItems(prev => [...prev, newItem])
  }
},
{
  text: '🖼️ Choose from Library',
  onPress: async () => {
    const uri = await pickFromLibrary()
    if (!uri) return
    const permanentUri = await saveImagePermanently(uri)
    const newItem = await addItem({
      name: 'New Item',
      category: 'Tops',
      emoji: '👕',
      photoUri: permanentUri,
      addedAt: addTime,
    })
    setItems(prev => [...prev, newItem])
  }
},
    { text: 'Cancel', style: 'cancel' }
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
        <Text style={styles.loadingText}>Loading your wardrobe ✨</Text>
      </View>
    )
  }

  return (
  <View style={styles.screen}>
    <TouchableOpacity
      onPress={handleAddItem}
      style={styles.addBtn}
    >
      <Text style={styles.addBtnText}>+ Add Item</Text>
    </TouchableOpacity>

    <FlatList
      data={items}
      keyExtractor={item => item.id}
      numColumns={2}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={{ gap: 12 }}
      renderItem={({ item }) => (
        <ClothingCard
          id={item.id}
          name={item.name}
          category={item.category}
          emoji={item.emoji}
          addedAt={item.addedAt}
          photoUri={item.photoUri}
        />
      )}
    />
  </View>
)
}

const styles = StyleSheet.create({
   screen: {
    flex: 1,                   
    backgroundColor: '#FAF7F2',
  },  
  grid: {
    padding: 16,
    gap: 12,
    backgroundColor: '#FAF7F2',
    marginTop: 16,
  },
  center: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'serif',
    fontSize: 18,
    color: '#8C5E4A',
  },
  addBtn: {
  margin: 16,
  backgroundColor: '#C97B5A',
  padding: 14,
  borderRadius: 12,
  alignItems: 'center',
},
addBtnText: {
  color: '#fff',
  fontWeight: '600',
  fontSize: 16,
}
})