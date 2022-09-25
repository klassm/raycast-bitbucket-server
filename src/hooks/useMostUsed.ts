import { countBy, keyBy, sortBy, takeRight } from "lodash";
import { Repository } from "../types/Repository";
import { useCache } from "./useCache";
import { useMemo } from "react";

function getMostUsed(repositories: Repository[]): Repository[] {
  const lookupRepositories = keyBy(repositories, (repository) => repository.id);
  const countEntries = Object.entries(countBy(repositories, (repository) => repository.id));
  return sortBy(countEntries, ([_entry, count]) => count)
    .reverse()
    .slice(0, 20)
    .map(([id]) => lookupRepositories[id])
    .filter((repository): repository is Repository => repository !== undefined);
}

function updateLastUsed(oldData: Repository[], newEntry: Repository): Repository[] {
  const newEntries = [...oldData, newEntry];
  return takeRight(newEntries, 100);
}

export function useMostUsed() {
  const { data, update } = useCache<Repository[]>("bitbucket-most-used", async () => [], {
    expirationMillis: 1000 * 60 * 24 * 60,
  });
  const mostUsed = useMemo(() => getMostUsed(data ?? []), [data]);

  return { mostUsed, add: (repository: Repository) => update(updateLastUsed(data ?? [], repository)) };
}
