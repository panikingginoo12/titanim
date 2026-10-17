import { Tabs } from 'expo-router';
import { Icon, type IconName } from '@/components/ui';
import { colors } from '@/theme';

const tab = (title: string, icon: IconName, focusedIcon: IconName) => ({
  title,
  tabBarIcon: ({ focused, color }: { focused: boolean; color: unknown }) => (
    <Icon name={focused ? focusedIcon : icon} size={24} color={String(color)} />
  ),
});

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen name="today" options={tab('Today', 'today-outline', 'today')} />
      <Tabs.Screen name="garden" options={tab('Garden', 'leaf-outline', 'leaf')} />
      <Tabs.Screen name="catalog" options={tab('Catalog', 'book-outline', 'book')} />
      <Tabs.Screen name="profile" options={tab('Profile', 'person-outline', 'person')} />
    </Tabs>
  );
}
