import { strToU8, zipSync } from 'fflate';
import { describe, expect, it } from 'vitest';
import { BackupError, packBackup, toRelativePhotoPath, unpackBackup, type BackupData } from './backupFormat';

const data: BackupData = {
  app: 'titanim',
  version: 1,
  createdAt: '2026-11-07T00:00:00.000Z',
  tables: {
    settings: [{ key: 'name', value: '"Tuper"' }],
    plants: [{ id: 1, nickname: 'Monching' }],
    photos: [{ id: 1, plant_id: 1, day: '2026-11-07', uri: 'photos/1/a.jpg', thumb_uri: 'photos/1/a-thumb.jpg' }],
    care_log: [],
    quests: [],
    xp_log: [{ id: 1, day: '2026-11-07', amount: 10, reason: 'quest:water' }],
    badges: [],
  },
};

describe('backup format', () => {
  it('round-trips rows and photos', () => {
    const files = { 'photos/1/a.jpg': new Uint8Array([1, 2, 3]), 'photos/1/a-thumb.jpg': new Uint8Array([4]) };
    const out = unpackBackup(packBackup(data, files));
    expect(out.data).toEqual(data);
    expect(out.files['photos/1/a.jpg']).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('rejects files that are not Titanim backups', () => {
    expect(() => unpackBackup(new Uint8Array([1, 2, 3]))).toThrow(BackupError);
    expect(() => unpackBackup(zipSync({ 'other.txt': strToU8('hi') }))).toThrow(/not a Titanim backup/);
    expect(() => unpackBackup(zipSync({ 'backup.json': strToU8('{"app":"other"}') }))).toThrow(/not a Titanim backup/);
  });

  it('rejects backups from a newer app version', () => {
    expect(() => unpackBackup(packBackup({ ...data, version: 99 }, {}))).toThrow(/newer version/);
  });

  it('rejects damaged tables and unsafe photo paths', () => {
    const broken = { ...data, tables: { ...data.tables, plants: undefined } } as unknown as BackupData;
    expect(() => unpackBackup(packBackup(broken, {}))).toThrow(/damaged/);
    const evil = { ...data, tables: { ...data.tables, photos: [{ ...data.tables.photos[0], uri: '../../evil.jpg' }] } };
    expect(() => unpackBackup(packBackup(evil, {}))).toThrow(/damaged/);
  });

  it('ignores unexpected files in the zip', () => {
    const zip = zipSync({ 'backup.json': strToU8(JSON.stringify(data)), '../escape.jpg': new Uint8Array([1]) });
    expect(Object.keys(unpackBackup(zip).files)).toEqual([]);
  });

  it('turns absolute photo uris into relative paths', () => {
    expect(toRelativePhotoPath('file:///data/user/0/app/files/photos/12/2026-11-07-1700.jpg')).toBe('photos/12/2026-11-07-1700.jpg');
    expect(toRelativePhotoPath('file:///cache/other.jpg')).toBeNull();
  });
});
