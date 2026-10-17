import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';
import type { SQLiteDatabase } from 'expo-sqlite';
import { deletePhotoRow, getPhotoForDay, upsertPhoto, type Milestone } from '@/db/photos';
import { completePhotoQuest } from '@/db/quests';
import type { Day } from './dates';

const FULL_WIDTH = 1080;
const THUMB_WIDTH = 360;

function plantDir(plantId: number): Directory {
  const dir = new Directory(Paths.document, 'photos', String(plantId));
  dir.create({ intermediates: true, idempotent: true });
  return dir;
}

async function render(sourceUri: string, width: number, compress: number): Promise<string> {
  const image = await ImageManipulator.manipulate(sourceUri).resize({ width }).renderAsync();
  const saved = await image.saveAsync({ compress, format: SaveFormat.JPEG });
  return saved.uri;
}

function moveInto(tempUri: string, dir: Directory, name: string): string {
  const dest = new File(dir, name);
  if (dest.exists) dest.delete();
  new File(tempUri).moveSync(dest);
  return dest.uri;
}

export function deleteFiles(uris: string[]): void {
  for (const uri of uris) {
    try {
      const f = new File(uri);
      if (f.exists) f.delete();
    } catch {
      // A missing file is fine; the row is what matters.
    }
  }
}

/**
 * Compresses a captured photo, stores a full image and a thumbnail in the app's documents
 * folder, and saves it as the plant's photo for `day` (replacing any earlier one that day).
 * Returns XP gained from the photo quest, if any.
 */
export async function savePlantPhoto(
  db: SQLiteDatabase,
  opts: {
    plantId: number;
    day: Day;
    captureUri: string;
    note: string | null;
    milestone: Milestone | null;
    saveToGallery: boolean;
  },
): Promise<number> {
  const [fullTemp, thumbTemp] = await Promise.all([
    render(opts.captureUri, FULL_WIDTH, 0.7),
    render(opts.captureUri, THUMB_WIDTH, 0.6),
  ]);
  const dir = plantDir(opts.plantId);
  const stamp = Date.now();
  const uri = moveInto(fullTemp, dir, `${opts.day}-${stamp}.jpg`);
  const thumbUri = moveInto(thumbTemp, dir, `${opts.day}-${stamp}-thumb.jpg`);

  const previous = await getPhotoForDay(db, opts.plantId, opts.day);
  await upsertPhoto(db, { plantId: opts.plantId, day: opts.day, uri, thumbUri, note: opts.note, milestone: opts.milestone });
  if (previous) deleteFiles([previous.uri, previous.thumbUri]);
  deleteFiles([opts.captureUri]);

  if (opts.saveToGallery) {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (perm.granted) await MediaLibrary.Asset.create(uri);
    } catch {
      // Gallery copy is a convenience; never fail the save over it.
    }
  }

  return completePhotoQuest(db, opts.plantId, opts.day);
}

export async function deletePlantPhoto(db: SQLiteDatabase, photoId: number): Promise<void> {
  const photo = await deletePhotoRow(db, photoId);
  if (photo) deleteFiles([photo.uri, photo.thumbUri]);
}
