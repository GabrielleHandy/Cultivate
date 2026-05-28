import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { useColorScheme } from '@/hooks/use-color-scheme'
import { Colors } from '@/constants/theme'

export default function TabLayout() {
  const scheme: keyof typeof Colors = useColorScheme() === 'dark' ? 'dark' : 'light'
  const C = Colors[scheme]

  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor:   C.tabActive,
      tabBarInactiveTintColor: C.tabInactive,
      tabBarStyle: {
        backgroundColor: C.tabBackground,
        borderTopColor:  C.tabBorder,
        borderTopWidth:  0.5,
        paddingTop: 6,
        height: 60,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        letterSpacing: 0.5,
        fontFamily: 'DMSans_400Regular',
        marginBottom: 4,
      },
      headerShown: false,
    }}>
      <Tabs.Screen
        name="wardrobe"
        options={{
          title: 'Wardrobe',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shirt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="outfits"
        options={{
          title: 'Outfits',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inspo"
        options={{
          title: 'Inspo',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="item/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
      <Tabs.Screen
        name="wishlist/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  )
}
