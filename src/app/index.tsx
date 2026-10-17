import { Redirect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { getSettings } from '@/db/settings';
import { colors } from '@/theme';

export default function Index() {
  const db = useSQLiteContext();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    getSettings(db).then((s) => setOnboarded(s.onboarded));
  }, [db]);

  if (onboarded === null) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  return <Redirect href={onboarded ? '/today' : '/onboarding'} />;
}
