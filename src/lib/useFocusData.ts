import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useLayoutEffect, useRef, useState } from 'react';

/**
 * Loads data from the local database whenever the screen comes into focus,
 * so lists stay fresh after editing on another screen. Pass `key` (for example
 * a plant id) so the data reloads when it changes.
 */
export function useFocusData<T>(load: (db: SQLiteDatabase) => Promise<T>, key?: string | number) {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const loadRef = useRef(load);
  useLayoutEffect(() => {
    loadRef.current = load;
  });

  const reload = useCallback(async () => {
    try {
      setData(await loadRef.current(db));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    }
    // `key` is not read here, but a new key must produce a new reload so the focus effect re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, key]);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { data, error, reload, db };
}
