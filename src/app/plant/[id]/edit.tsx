import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { PlantForm } from '@/components/PlantForm';
import { Button } from '@/components/ui';
import { deletePlantRow, getPlant, updatePlant, type Plant } from '@/db/plants';
import { deleteFiles } from '@/lib/photos';
import { colors, space } from '@/theme';

export default function EditPlant() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [plant, setPlant] = useState<Plant | null>(null);

  useEffect(() => {
    getPlant(db, Number(id)).then(setPlant);
  }, [db, id]);

  if (!plant) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  function confirmDelete() {
    Alert.alert(
      `Delete ${plant!.nickname}?`,
      `This removes the plant and all ${plant!.photoCount} of its photos from this phone. Your XP and badges stay.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const files = await deletePlantRow(db, plant!.id);
            deleteFiles(files);
            if (router.canDismiss()) router.dismissAll();
            router.navigate('/garden');
          },
        },
      ],
    );
  }

  return (
    <PlantForm
      submitLabel="Save changes"
      initial={{
        nickname: plant.nickname,
        speciesId: plant.speciesId,
        speciesName: plant.speciesName,
        scientificName: plant.scientificName,
        location: plant.location,
        acquiredDay: plant.acquiredDay,
        waterEveryDays: plant.waterEveryDays,
      }}
      onSubmit={async (input) => {
        await updatePlant(db, plant.id, input);
        router.back();
      }}
      footer={
        <Button label="Delete plant" variant="danger" icon="trash-outline" onPress={confirmDelete} style={{ marginTop: space.md }} />
      }
    />
  );
}
