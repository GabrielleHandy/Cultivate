import { useState, useCallback } from 'react'
import { View, FlatList, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import ClothingCard from '@/components/ClothingCard'
import { ClothingItem } from '@/constants/types'
import { addItem, loadWardrobe } from '../../utils/storage'
import { tagClothingItem } from '@/utils/claude'
import { useFocusEffect } from 'expo-router'
import { useImagePicker } from '@/hooks/useImagePicker'
import * as FileSystem from 'expo-file-system'

const CATEGORY_EMOJI: Record<string, string> = {
  Tops: '👕',
  Bottoms: '👖',
  Shoes: '👟',
  Dresses: '👗',
  Outerwear: '🧥',
  Accessories: '👜',
  Other: '🎽',
}



export default function WardrobeScreen() {
  const [items, setItems] = useState<ClothingItem[]>([])
  const [loading, setLoading] = useState(true)
  const [tagging, setTagging] = useState(false)
  const { takePhoto, pickFromLibrary } = useImagePicker()

  const saveImagePermanently = async (uri: string): Promise<string> => {
  const filename = uri.split('/').pop()!
  const destPath = FileSystem.Paths.document.uri + filename
  
  const sourceFile = new FileSystem.File(uri)
  const destFile = new FileSystem.File(destPath)
  sourceFile.copy(destFile)
  
  return destPath
}
  const handleAddItem = async () => {
  Alert.alert('Add Clothing', 'Where would you like to add from?', [
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
  }
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
      disabled={tagging}
    >
      {tagging ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ActivityIndicator color='#fff' size='small' />
          <Text style={styles.addBtnText}>Tagging item...</Text>
        </View>
      ) : (
        <Text style={styles.addBtnText}>+ Add Item</Text>
      )}
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