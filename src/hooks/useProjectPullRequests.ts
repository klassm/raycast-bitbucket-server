import { loadProjectPullRequests } from "../bitbucket/loadPullRequests";
import { Repository } from "../types/Repository";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useProjectPullRequests(repository: Repository) {
  const config = useConfig();
  const { data, loading, reload } = useCache(
    `bitbucket-pull-requests-${repository.id}`,
    async () => loadProjectPullRequests(config, repository),
    {
      expirationMillis: 1000 * 60,
    },
  );
  return { pullRequests: data, loading, reload };
}
