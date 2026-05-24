import { ClothingItem, ClothingCategoryOptions } from '@/constants/types'
import { deleteItem, loadWardrobe, updateItem } from '@/utils/storage'
import { useLocalSearchParams, router, useFocusEffect } from 'expo-router'
import { useState, useCallback } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, TextInput } from 'react-native'

export default function ItemDetail() {
  const { name, category, emoji, id, photoUri } = useLocalSearchParams()

  const [editMode, setEditMode] = useState(false)
  const [selectedName, setSelectedName] = useState(name as string)
  const [selectedCategory, setSelectedCategory] = useState(category as string)
  const [selectedPhotoUri, setSelectedPhotoUri] = useState(photoUri as string | undefined)
  const [changesMade, setChangesMade] = useState(false)

  // Reload from storage on focus so image and fields are always fresh
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

  const handleEdit = () => {
    setEditMode(!editMode)
    setChangesMade(false)
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

  const handleDelete = async () => {
    await deleteItem(id as string)
    router.back()
  }

  return (
    <View style={styles.screen}>

      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>

      {selectedPhotoUri ? (
        <Image source={{ uri: selectedPhotoUri }} style={styles.photo} />
      ) : (
        <Text style={styles.emoji}>{emoji}</Text>
      )}

      {editMode ? (
        <TextInput
          style={styles.nameInput}
          value={selectedName}
          onChangeText={updateName}
          placeholder="Item name"
          placeholderTextColor="#C4A898"
        />
      ) : (
        <Text style={styles.name}>{selectedName}</Text>
      )}

      {editMode ? (
        <View style={styles.categoryRow}>
          {ClothingCategoryOptions.map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => updateCategory(option)}
              style={[
                styles.categoryBtn,
                selectedCategory === option && styles.categoryBtnSelected
              ]}
            >
              <Text style={[
                styles.categoryBtnText,
                selectedCategory === option && styles.categoryBtnTextSelected
              ]}>
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <Text style={styles.category}>{selectedCategory}</Text>
      )}

      {editMode && changesMade && (
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save Changes</Text>
        </TouchableOpacity>
      )}

      <View style={styles.actionBar}>
        <ActionButton emoji="✨" label="Add to Outfit" onPress={() => {}} />
        <ActionButton emoji="🔍" label="Find Similar" onPress={() => {}} />
        <ActionButton emoji="✏️" label="Edit" onPress={handleEdit} />
        <ActionButton emoji="🗑️" label="Delete" onPress={handleDelete} />
      </View>

    </View>
  )
}

function ActionButton({ emoji, label, onPress }: {
  emoji: string
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.actionBtn} onPress={onPress}>
      <Text style={styles.actionEmoji}>{emoji}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  back: { position: 'absolute', top: 40, left: 20 },
  backText: { fontSize: 16, color: '#C97B5A', fontWeight: '500' },
  photo: {
    width: 200,
    height: 260,
    borderRadius: 16,
    marginBottom: 16,
    resizeMode: 'cover',
  },
  emoji: { fontSize: 80, marginBottom: 16 },
  name: { fontSize: 28, fontWeight: '600', color: '#2C1F1A' },
  nameInput: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2C1F1A',
    borderBottomWidth: 2,
    borderBottomColor: '#C97B5A',
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginBottom: 12,
    minWidth: 200,
    textAlign: 'center',
  },
  category: { fontSize: 16, color: '#8C5E4A', marginTop: 6 },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 12,
  },
  categoryBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1.5,
    borderColor: '#C97B5A',
  },
  categoryBtnSelected: {
    backgroundColor: '#C97B5A',
  },
  categoryBtnText: {
    fontSize: 12,
    color: '#C97B5A',
    fontWeight: '500',
  },
  categoryBtnTextSelected: {
    color: '#fff',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#C97B5A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFCF8',
    borderTopWidth: 1,
    borderTopColor: 'rgba(44,31,26,0.1)',
    paddingBottom: 24,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  actionEmoji: { fontSize: 22 },
  actionLabel: {
    fontSize: 11,
    color: '#8C5E4A',
    fontWeight: '500',
    textAlign: 'center',
  },
})