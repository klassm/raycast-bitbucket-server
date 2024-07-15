import { Cache } from "@raycast/api";
import { useEffect, useState, useMemo } from "react";

const cache = new Cache();

export type CacheProvider<T> = () => Promise<T>;

export interface CacheOptions {
  expirationMillis: number;
}

interface CacheData<T> {
  lastModified: number;
  data: T;
}

async function loadData<T>(
  cacheKey: string,
  provider: CacheProvider<T>,
  options: CacheOptions,
  force: boolean,
): Promise<T> {
  const cachedData = cache.get(cacheKey);
  const parsedData: CacheData<T> | undefined = cachedData === undefined ? undefined : JSON.parse(cachedData);

  const now = new Date().getTime();
  if (!force && parsedData !== undefined && now - parsedData.lastModified < options.expirationMillis) {
    return parsedData.data;
  }

  const data = await provider();
  updateData(cacheKey, data);
  return data;
}

function updateData<T>(cacheKey: string, newData: T) {
  const now = new Date().getTime();
  cache.set(
    cacheKey,
    JSON.stringify({
      lastModified: now,
      data: newData,
    } as CacheData<T>),
  );
}

export function useCache<T>(key: string, provider: CacheProvider<T>, options: CacheOptions) {
  const [data, setData] = useState<T | undefined>();
  const [loading, setLoading] = useState<boolean>(false);

  const reloadData = useMemo(() => {
    return async (force: boolean) => {
      setLoading(true);
      await loadData(key, provider, options, force)
        .then((newDate) => {
          setData(newDate);
        })
        .finally(() => setLoading(false));
    };
  }, [loadData, setLoading, key]);

  const update = useMemo(
    () => (newData: T) => {
      updateData(key, newData);
      void reloadData(false);
    },
    [updateData, reloadData],
  );
  useEffect(() => void reloadData(true), [reloadData]);

  return {
    data,
    loading,
    update,
    reload: async () => reloadData(true),
  };
}
