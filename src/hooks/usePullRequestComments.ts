import { loadPullRequestsComments } from "../bitbucket/loadPullRequestComments";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function usePullRequestComments(pullRequest: PullRequest) {
  const config = useConfig();
  const { data, loading, reload } = useCache(
    `pr-comments-${pullRequest.projectKey}-${pullRequest.repositorySlug}-${pullRequest.id}`,
    async () => loadPullRequestsComments(config, pullRequest),
    {
      expirationMillis: 1000 * 120,
    },
  );
  return { comments: data, loading, reload };
}
