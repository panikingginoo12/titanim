import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Icon } from '@/components/ui';
import { saveSettings } from '@/db/settings';
import { pickAndRestore } from '@/lib/restoreFlow';
import type { Persona } from '@/lib/game/xp';
import { colors, radius, space, type } from '@/theme';

const PERSONAS: { id: Persona; label: string; emoji: string }[] = [
  { id: 'plantita', label: 'Plantita', emoji: '👩‍🌾' },
  { id: 'plantito', label: 'Plantito', emoji: '👨‍🌾' },
];

export default function Onboarding() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [name, setName] = useState('');
  const [persona, setPersona] = useState<Persona>('plantita');
  const [saving, setSaving] = useState(false);

  async function restore() {
    if (await pickAndRestore(db)) router.replace('/today');
  }

  async function start() {
    setSaving(true);
    await saveSettings(db, { onboarded: true, name: name.trim(), persona });
    router.replace('/garden');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Icon name="leaf" size={40} color={colors.onPrimary} />
          </View>
          <Text style={type.display}>Titanim</Text>
          <Text style={[type.body, { color: colors.textMuted }]}>
            Para sa mga Plantito at Plantita. Track your plants, take daily glow-up photos, and level up by caring for them.
          </Text>

          <Text style={[type.label, styles.label]}>Anong pangalan mo?</Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textFaint}
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
            accessibilityLabel="Your name"
            maxLength={40}
          />

          <Text style={[type.label, styles.label]}>Ikaw ay isang…</Text>
          <View style={styles.personaRow}>
            {PERSONAS.map((p) => {
              const selected = persona === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => setPersona(p.id)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  accessibilityLabel={p.label}
                  style={[styles.persona, selected && styles.personaSelected]}
                >
                  <Text style={styles.emoji}>{p.emoji}</Text>
                  <Text style={[type.heading, selected && { color: colors.primary }]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Card style={styles.note}>
            <Icon name="information-circle-outline" size={20} color={colors.terracotta} />
            <Text style={[type.small, { flex: 1 }]}>
              Your plants and photos are saved only on this phone. Nothing is uploaded. If you uninstall the app or lose
              the phone, they are gone, so turn on “Save a copy to Gallery” in your profile if you want a backup.
            </Text>
          </Card>

          <Button label="Simulan na!" icon="arrow-forward" onPress={start} loading={saving} style={{ marginTop: space.lg }} />
          <Button label="May backup ka? Restore it" variant="ghost" icon="cloud-download-outline" onPress={restore} disabled={saving} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: space.xl, gap: space.md, paddingTop: space.xxl },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.sm,
  },
  label: { marginTop: space.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    minHeight: 50,
    fontSize: 16,
    color: colors.text,
  },
  personaRow: { flexDirection: 'row', gap: space.md },
  persona: {
    flex: 1,
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  personaSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  emoji: { fontSize: 36 },
  note: { flexDirection: 'row', gap: space.sm, marginTop: space.lg, backgroundColor: colors.terracottaSoft, borderColor: colors.terracottaSoft },
});
