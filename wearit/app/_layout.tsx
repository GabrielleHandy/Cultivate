import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { useShareIntent } from 'expo-share-intent';
import {
  useFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_600SemiBold,
} from '@expo-google-fonts/playfair-display';
import {
  DMSans_300Light,
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { setPendingSharedUri } from '@/utils/shareIntent';
import { WearItThemeProvider } from '@/contexts/ThemeContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { shareIntent, resetShareIntent } = useShareIntent();
  const [fontsLoaded] = useFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_600SemiBold,
    DMSans_300Light,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  useEffect(() => {
    const imageFile = shareIntent?.files?.find(f =>
      f.mimeType?.startsWith('image/')
    )
    if (imageFile?.uri) {
      setPendingSharedUri(imageFile.uri)
      resetShareIntent()
      router.push('/(tabs)/shopping')
    }
  }, [shareIntent])

  if (!fontsLoaded) return null;

  return (
    <WearItThemeProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </WearItThemeProvider>
  );
}
