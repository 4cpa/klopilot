import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/lib/hooks';
import { MapTargetProvider } from '@/lib/map-target';

export default function TabLayout() {
  const c = useThemeColors();
  const { t } = useTranslation();

  return (
    <MapTargetProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { backgroundColor: c.surface, borderTopColor: c.line },
          tabBarActiveTintColor: c.brandPrimary,
          tabBarInactiveTintColor: c.muted,
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t('tabs.map'),
            tabBarIcon: ({ color }) => <TabIcon emoji="🗺️" color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: t('tabs.search'),
            tabBarIcon: ({ color }) => <TabIcon emoji="🔍" color={color} />,
          }}
        />
        <Tabs.Screen
          name="contribute"
          options={{
            title: t('tabs.contribute'),
            tabBarIcon: ({ color }) => <TabIcon emoji="➕" color={color} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t('tabs.profile'),
            tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
          }}
        />
      </Tabs>
    </MapTargetProvider>
  );
}

function TabIcon({ emoji, color: _color }: { emoji: string; color: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}
