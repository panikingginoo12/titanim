import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, Icon, SectionLabel, type IconName } from '@/components/ui';
import { CATEGORY_LABEL, getSpecies, HUMIDITY_LABEL, LIGHT_LABEL } from '@/data/species';
import { colors, radius, space, type } from '@/theme';

function Fact({ icon, label, value, tone = colors.primary }: { icon: IconName; label: string; value: string; tone?: string }) {
  return (
    <View style={styles.fact}>
      <View style={[styles.factIcon, { backgroundColor: `${tone}1A` }]}>
        <Icon name={icon} size={20} color={tone} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.label}>{label}</Text>
        <Text style={type.body}>{value}</Text>
      </View>
    </View>
  );
}

function petText(toxic: boolean | null): string {
  if (toxic === true) return 'Toxic to cats and dogs. Keep out of reach.';
  if (toxic === false) return 'Generally considered safe for pets.';
  return 'Not sure. Keep away from pets to be safe.';
}

export default function SpeciesDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; name?: string; scientificName?: string; family?: string }>();
  const species = getSpecies(params.id);

  if (!species) {
    // A GBIF result: names only, no care guide.
    const name = params.name ?? 'Unknown plant';
    return (
      <ScrollView contentContainerStyle={styles.content}>
        <Stack.Screen options={{ title: name }} />
        <Text style={type.display}>{name}</Text>
        <Text style={[type.body, styles.sci]}>{params.scientificName}</Text>
        {params.family ? <Text style={type.small}>Family {params.family}</Text> : null}
        <Card style={styles.notice}>
          <Icon name="information-circle-outline" size={20} color={colors.water} />
          <Text style={[type.small, { flex: 1 }]}>
            This plant comes from GBIF, an open species database, so Titanim does not have a care guide for it yet. You
            will get general quests and can set your own watering schedule.
          </Text>
        </Card>
        <Button
          label="Add to My Garden"
          icon="add"
          onPress={() =>
            router.push({
              pathname: '/plant/new',
              params: { speciesName: name, scientificName: params.scientificName ?? '' },
            })
          }
        />
      </ScrollView>
    );
  }

  const c = species.care;
  const [name, ...aka] = species.commonNames;
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: name }} />
      <Text style={type.label}>{CATEGORY_LABEL[species.category]}</Text>
      <Text style={type.display}>{name}</Text>
      <Text style={[type.body, styles.sci]}>{species.scientificName}</Text>
      {aka.length > 0 ? <Text style={type.small}>Also called {aka.join(', ')}</Text> : null}

      <Button
        label="Add to My Garden"
        icon="add"
        style={{ marginTop: space.lg }}
        onPress={() => router.push({ pathname: '/plant/new', params: { speciesId: species.id } })}
      />

      <SectionLabel>Care basics</SectionLabel>
      <Card style={{ gap: space.lg }}>
        <Fact icon="water" label="Water" value={`About every ${c.waterEveryDays} ${c.waterEveryDays === 1 ? 'day' : 'days'}, when the topsoil is dry`} tone={colors.water} />
        <Fact icon="sunny" label="Light" value={LIGHT_LABEL[c.light]} tone={colors.sun} />
        <Fact icon="rainy" label="Humidity" value={HUMIDITY_LABEL[c.humidity]} tone={colors.water} />
        <Fact
          icon="nutrition"
          label="Feeding"
          value={c.fertilizeEveryDays ? `Diluted fertilizer every ${c.fertilizeEveryDays} days` : 'Rarely needs fertilizer'}
        />
        <Fact icon="paw" label="Pets" value={petText(c.toxicToPets)} tone={c.toxicToPets === false ? colors.primary : colors.terracotta} />
      </Card>

      <SectionLabel>Tips</SectionLabel>
      <Card style={{ gap: space.md }}>
        {c.tips.map((tip) => (
          <View key={tip} style={styles.tip}>
            <Icon name="leaf-outline" size={16} color={colors.primary} />
            <Text style={[type.body, { flex: 1 }]}>{tip}</Text>
          </View>
        ))}
      </Card>

      <Text style={[type.small, styles.disclaimer]}>
        These are general tips, not guarantees. Every pot, soil and spot is different, so watch your plant and adjust.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, paddingBottom: space.xxl, gap: space.xs },
  sci: { fontStyle: 'italic', color: colors.textMuted },
  fact: { flexDirection: 'row', gap: space.md, alignItems: 'center' },
  factIcon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  tip: { flexDirection: 'row', gap: space.sm, alignItems: 'flex-start' },
  notice: { flexDirection: 'row', gap: space.sm, marginVertical: space.lg, backgroundColor: colors.waterSoft, borderColor: colors.waterSoft },
  disclaimer: { marginTop: space.lg },
});
