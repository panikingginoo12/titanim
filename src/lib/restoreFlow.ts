import type { SQLiteDatabase } from 'expo-sqlite';
import { Alert } from 'react-native';
import { BackupError, pickBackup, restoreBackup } from './backup';

function confirm(title: string, message: string, action: string): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: action, style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

/** Pick a backup, confirm, and restore it. Returns true when data was replaced. */
export async function pickAndRestore(db: SQLiteDatabase): Promise<boolean> {
  try {
    const backup = await pickBackup();
    if (!backup) return false;
    const plants = backup.data.tables.plants.length;
    const photos = backup.data.tables.photos.length;
    const ok = await confirm(
      'Restore this backup?',
      `It has ${plants} ${plants === 1 ? 'plant' : 'plants'} and ${photos} ${photos === 1 ? 'photo' : 'photos'}. ` +
        'Everything currently on this phone will be replaced.',
      'Restore',
    );
    if (!ok) return false;
    await restoreBackup(db, backup);
    return true;
  } catch (e) {
    Alert.alert('Hindi ma-restore', e instanceof BackupError ? e.message : 'Something went wrong while restoring. Please try again.');
    return false;
  }
}
