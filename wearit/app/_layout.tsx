import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { useShareIntent } from 'expo-share-intent';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { setPendingSharedUri } from '@/utils/shareIntent';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { shareIntent, resetShareIntent } = useShareIntent();

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

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
