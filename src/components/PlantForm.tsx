import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { getSpecies } from '@/data/species';
import type { PlantInput } from '@/db/plants';
import { addDays, daysBetween, today, type Day } from '@/lib/dates';
import { NICKNAME_MAX, validatePlantForm, WATER_MAX, WATER_MIN, waterOverride, type PlantFormErrors } from '@/lib/plantForm';
import { GENERIC_CARE } from '@/lib/quests/engine';
import { colors, radius, space, type } from '@/theme';
import { Button, Chip, Icon } from './ui';

const ACQUIRED: { label: string; daysAgo: number }[] = [
  { label: 'Today', daysAgo: 0 },
  { label: 'Last week', daysAgo: 7 },
  { label: 'Last month', daysAgo: 30 },
  { label: '3+ months', daysAgo: 90 },
];

function closestAcquired(day: Day): number {
  const ago = daysBetween(day, today());
  return ACQUIRED.reduce((best, a) => (Math.abs(a.daysAgo - ago) < Math.abs(best - ago) ? a.daysAgo : best), 0);
}

type Props = {
  initial: PlantInput;
  submitLabel: string;
  onSubmit: (input: PlantInput) => Promise<void>;
  footer?: React.ReactNode;
};

export function PlantForm({ initial, submitLabel, onSubmit, footer }: Props) {
  const species = getSpecies(initial.speciesId);
  const guideDefault = species?.care.waterEveryDays;
  const [nickname, setNickname] = useState(initial.nickname);
  const [location, setLocation] = useState(initial.location);
  const [acquiredAgo, setAcquiredAgo] = useState(closestAcquired(initial.acquiredDay));
  const [keepAcquired, setKeepAcquired] = useState(true);
  const [water, setWater] = useState(initial.waterEveryDays ?? guideDefault ?? GENERIC_CARE.waterEveryDays);
  const [errors, setErrors] = useState<PlantFormErrors>({});
  const [saving, setSaving] = useState(false);

  const speciesLabel = species?.commonNames[0] ?? initial.speciesName ?? initial.scientificName;

  async function submit() {
    const errs = validatePlantForm({ nickname, waterEveryDays: water });
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setSaving(true);
    try {
      await onSubmit({
        ...initial,
        nickname: nickname.trim(),
        location,
        acquiredDay: keepAcquired ? initial.acquiredDay : addDays(today(), -acquiredAgo),
        waterEveryDays: waterOverride(water, guideDefault),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.species}>
          <Icon name={speciesLabel ? 'leaf' : 'help-circle-outline'} size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={type.label}>Species</Text>
            <Text style={type.body}>{speciesLabel ?? 'Not set'}</Text>
            {initial.scientificName && initial.scientificName !== speciesLabel ? (
              <Text style={[type.small, { fontStyle: 'italic' }]}>{initial.scientificName}</Text>
            ) : null}
          </View>
        </View>

        <Text style={type.label}>Nickname</Text>
        <TextInput
          value={nickname}
          onChangeText={setNickname}
          placeholder="e.g. Monching, Bebe Pothos"
          placeholderTextColor={colors.textFaint}
          style={[styles.input, errors.nickname && styles.inputError]}
          maxLength={NICKNAME_MAX + 5}
          accessibilityLabel="Nickname"
          autoCapitalize="words"
        />
        {errors.nickname ? <Text style={styles.error}>{errors.nickname}</Text> : null}

        <Text style={[type.label, styles.gap]}>Where is it?</Text>
        <View style={styles.row}>
          <Chip label="Indoor" icon="home-outline" selected={location === 'indoor'} onPress={() => setLocation('indoor')} />
          <Chip label="Outdoor" icon="sunny-outline" selected={location === 'outdoor'} onPress={() => setLocation('outdoor')} />
        </View>

        <Text style={[type.label, styles.gap]}>When did you get it?</Text>
        <View style={[styles.row, { flexWrap: 'wrap' }]}>
          {ACQUIRED.map((a) => (
            <Chip
              key={a.label}
              label={a.label}
              selected={acquiredAgo === a.daysAgo}
              onPress={() => {
                setAcquiredAgo(a.daysAgo);
                setKeepAcquired(false);
              }}
            />
          ))}
        </View>

        <Text style={[type.label, styles.gap]}>Water about every</Text>
        <View style={styles.stepper}>
          <Pressable
            onPress={() => setWater((w) => Math.max(WATER_MIN, w - 1))}
            style={styles.stepBtn}
            accessibilityRole="button"
            accessibilityLabel="Fewer days"
          >
            <Icon name="remove" size={22} color={colors.primary} />
          </Pressable>
          <Text style={[type.title, { minWidth: 90, textAlign: 'center' }]} accessibilityLiveRegion="polite">
            {water} {water === 1 ? 'day' : 'days'}
          </Text>
          <Pressable
            onPress={() => setWater((w) => Math.min(WATER_MAX, w + 1))}
            style={styles.stepBtn}
            accessibilityRole="button"
            accessibilityLabel="More days"
          >
            <Icon name="add" size={22} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={type.small}>
          {guideDefault
            ? water === guideDefault
              ? 'From the care guide. Adjust if your plant dries faster or slower.'
              : `Care guide says ${guideDefault} days. Your setting will be used instead.`
            : 'Water when the top of the soil feels dry. Adjust as you learn your plant.'}
        </Text>
        {errors.waterEveryDays ? <Text style={styles.error}>{errors.waterEveryDays}</Text> : null}

        <Button label={submitLabel} onPress={submit} loading={saving} style={{ marginTop: space.xl }} />
        {footer}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.sm, paddingBottom: space.xxl },
  species: {
    flexDirection: 'row',
    gap: space.md,
    alignItems: 'center',
    padding: space.md,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    marginBottom: space.md,
  },
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
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
  gap: { marginTop: space.md },
  row: { flexDirection: 'row', gap: space.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  stepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
