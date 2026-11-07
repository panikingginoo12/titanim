import { Pressable, StyleSheet, Text, View } from 'react-native';
import { weatherFlags, weatherTip, type Forecast, type Place } from '@/lib/weather';
import { colors, radius, space, type } from '@/theme';
import { Icon, type IconName } from './ui';

function iconFor(f: Forecast): IconName {
  const flags = weatherFlags(f);
  if (flags.windy) return 'thunderstorm-outline';
  if (flags.rainy) return 'rainy-outline';
  if (flags.hot) return 'sunny';
  return 'partly-sunny';
}

type Props = { place: Place | null; forecast: Forecast | null; onSetPlace: () => void };

export function WeatherCard({ place, forecast, onSetPlace }: Props) {
  if (!place) {
    return (
      <Pressable onPress={onSetPlace} style={[styles.card, styles.prompt]} accessibilityRole="button">
        <Icon name="location-outline" size={22} color={colors.water} />
        <View style={{ flex: 1 }}>
          <Text style={type.heading}>Weather tips</Text>
          <Text style={type.small}>Set your city so quests know when it will rain, be windy or very hot.</Text>
        </View>
        <Icon name="chevron-forward" size={20} color={colors.textFaint} />
      </Pressable>
    );
  }
  if (!forecast) return null;

  const flags = weatherFlags(forecast);
  return (
    <View style={styles.card} accessible accessibilityLabel={`Weather in ${place.name}. ${weatherTip(flags)}`}>
      <View style={styles.row}>
        <Icon name={iconFor(forecast)} size={28} color={flags.rainy || flags.windy ? colors.water : colors.sun} />
        <View style={{ flex: 1 }}>
          <Text style={type.body}>{weatherTip(flags)}</Text>
          <Text style={type.small}>
            {place.name} · {Math.round(forecast.tempMax)}°C · ulan {Math.round(forecast.rainChance)}% · hangin{' '}
            {Math.round(forecast.gustKmh)} km/h
          </Text>
        </View>
      </View>
      <Text style={styles.credit}>Weather data by Open-Meteo.com</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.waterSoft,
    borderRadius: radius.lg,
    padding: space.md,
    marginHorizontal: space.lg,
    marginTop: space.md,
    gap: space.xs,
  },
  prompt: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  credit: { fontSize: 11, color: colors.textMuted, textAlign: 'right' },
});
