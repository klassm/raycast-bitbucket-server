import { loadPullRequests } from "../bitbucket/loadPullRequests";
import { Repository } from "../types/Repository";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function usePullRequests(repository: Repository) {
  const config = useConfig();
  const { data, loading } = useCache(
    `bitbucket-pull-requests-${repository.id}`,
    async () => loadPullRequests(config, repository),
    {
      expirationMillis: 1000 * 60,
    }
  );
  return { pullRequests: data, loading };
}
