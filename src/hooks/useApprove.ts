import { PullRequest } from "../bitbucket/loadPullRequests";
import { useConfig } from "./useConfig";
import { approve } from "../bitbucket/approve";

export function useApprove(pullRequest: PullRequest) {
  const config = useConfig();
  return {
    approve: async () => approve(config, pullRequest),
    approved: pullRequest.reviewers.some((reviewer) => reviewer.approved),
    approvedByUser: pullRequest.reviewers
      .filter((reviewer) => reviewer.user.name === config.user)
      .some((reviewer) => reviewer.approved),
  };
}
