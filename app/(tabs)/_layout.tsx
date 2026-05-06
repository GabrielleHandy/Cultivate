import { Tabs } from 'expo-router'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#C97B5A',
      tabBarInactiveTintColor: '#8C5E4A',
      tabBarStyle: {
        backgroundColor: '#FAF7F2',
        borderTopColor: 'rgba(44,31,26,0.1)',
      },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="wardrobe"
        options={{ title: 'Wardrobe', tabBarIcon: ({ color }) => (
          <TabIcon emoji="👗" color={color} />
        )}}
      />
      <Tabs.Screen
        name="outfits"
        options={{ title: 'Outfits', tabBarIcon: ({ color }) => (
          <TabIcon emoji="✨" color={color} />
        )}}
      />
      <Tabs.Screen
        name="shopping"
        options={{ title: 'Shopping', tabBarIcon: ({ color }) => (
          <TabIcon emoji="🛍️" color={color} />
        )}}
      />
      <Tabs.Screen
        name="item/[id]"
        options={{
          href: null,        // ← hides it from the tab bar completely
          tabBarStyle: { display: 'none' }  // ← also hides the tab bar on this screen
        }}
      />
    </Tabs> 
  )
}

function TabIcon({ emoji, color }: { emoji: string; color: string }){
  const { Text } = require('react-native')
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>
}