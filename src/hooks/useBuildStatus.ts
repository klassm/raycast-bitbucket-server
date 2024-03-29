import { loadBuildStatus } from "../bitbucket/loadBuildStatus";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useBuildStatus(pullRequest: PullRequest) {
  const config = useConfig();
  const { data, loading, reload } = useCache(
    `pr-build-status-${pullRequest.projectKey}-${pullRequest.repositorySlug}-${pullRequest.id}`,
    async () => loadBuildStatus(config, pullRequest),
    {
      expirationMillis: 1000 * 30,
    },
  );
  return { buildStatus: data, loading, reload };
}
