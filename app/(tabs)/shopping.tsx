import { View, Text, StyleSheet } from 'react-native'

export default function ShoppingScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Shopping List</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FAF7F2',
             alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 24, fontWeight: '600' }
})