import * as ImagePicker from 'expo-image-picker'

export function useImagePicker() {
  const takePhoto = async (): Promise<string | null> => {
    const { granted } = await ImagePicker.requestCameraPermissionsAsync()
    if (!granted) return null

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    })

    if (result.canceled) return null
    return result.assets[0].uri
  }

  const pickFromLibrary = async (): Promise<string | null> => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!granted) return null

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    })

    if (result.canceled) return null
    return result.assets[0].uri
  }

  return { takePhoto, pickFromLibrary }
}