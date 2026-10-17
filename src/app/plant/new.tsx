import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCelebrate } from '@/components/Celebration';
import { PlantForm } from '@/components/PlantForm';
import { getSpecies } from '@/data/species';
import { createPlant } from '@/db/plants';
import { today } from '@/lib/dates';
import { suggestNickname } from '@/lib/plantForm';
import { withRewards } from '@/lib/rewards';

export default function NewPlant() {
  const db = useSQLiteContext();
  const router = useRouter();
  const celebrate = useCelebrate();
  const params = useLocalSearchParams<{ speciesId?: string; speciesName?: string; scientificName?: string }>();
  const species = getSpecies(params.speciesId);

  return (
    <PlantForm
      submitLabel="Add to My Garden"
      initial={{
        nickname: suggestNickname(species?.commonNames[0] ?? params.speciesName),
        speciesId: species?.id ?? null,
        speciesName: species ? null : params.speciesName || null,
        scientificName: species?.scientificName ?? (params.scientificName || null),
        location: species?.care.light === 'full-sun' ? 'outdoor' : 'indoor',
        acquiredDay: today(),
        waterEveryDays: null,
      }}
      onSubmit={async (input) => {
        let id = 0;
        const reward = await withRewards(db, async () => {
          id = await createPlant(db, input);
          return 0;
        });
        celebrate(reward);
        if (router.canDismiss()) router.dismissAll();
        router.push({ pathname: '/plant/[id]', params: { id: String(id) } });
      }}
    />
  );
}
