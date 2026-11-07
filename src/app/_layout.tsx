import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CelebrationProvider } from '@/components/Celebration';
import { migrate } from '@/db/migrations';
import { useReminderDeepLink } from '@/lib/notifications';
import { colors } from '@/theme';

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

function AppStack() {
  useReminderDeepLink();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTransparent: false,
        headerShadowVisible: false,
        headerTintColor: colors.primary,
        headerTitleStyle: { color: colors.text, fontWeight: '700' },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="plant/new" options={{ title: 'Add a plant', presentation: 'modal' }} />
      <Stack.Screen name="plant/[id]/index" options={{ title: '' }} />
      <Stack.Screen name="plant/[id]/edit" options={{ title: 'Edit plant', presentation: 'modal' }} />
      <Stack.Screen name="plant/[id]/camera" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="plant/[id]/photos" options={{ headerShown: false, presentation: 'fullScreenModal' }} />
      <Stack.Screen name="plant/[id]/glowup" options={{ title: 'Glow-up' }} />
      <Stack.Screen name="catalog/[id]" options={{ title: '' }} />
      <Stack.Screen name="identify" options={{ title: 'Identify a plant', presentation: 'modal' }} />
      <Stack.Screen name="location" options={{ title: 'Weather location', presentation: 'modal' }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Suspense fallback={<Loading />}>
        <SQLiteProvider databaseName="titanim.db" onInit={migrate} useSuspense>
          <CelebrationProvider>
            <AppStack />
          </CelebrationProvider>
        </SQLiteProvider>
      </Suspense>
    </SafeAreaProvider>
  );
}
