import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useTheme } from '@/contexts/ThemeContext'

export default function TabLayout() {
  const { theme } = useTheme()

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: theme.tabActive,
      tabBarInactiveTintColor: theme.tabInactive,
      tabBarStyle: {
        backgroundColor: theme.tabBar,
        borderTopColor: theme.tabBarBorder,
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
        name="settings"
        options={{ title: 'Settings', tabBarIcon: ({ color }) => (
          <TabIcon emoji="⚙️" color={color} />
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
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>
}