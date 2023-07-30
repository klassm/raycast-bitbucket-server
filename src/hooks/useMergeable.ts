import { loadIsMergeable } from "../bitbucket/loadMergability";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useMergeable(pullRequest: PullRequest) {
  const config = useConfig();
  const { data, loading } = useCache(
    `pr-mergeable-${pullRequest.projectKey}-${pullRequest.repositorySlug}-${pullRequest.id}`,
    async () => loadIsMergeable(config, pullRequest),
    {
      expirationMillis: 1000 * 30,
    }
  );
  return { mergeable: data, loading };
}
