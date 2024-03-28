import { PullRequest } from "../bitbucket/loadPullRequests";
import { merge } from "../bitbucket/merge";
import { useConfig } from "./useConfig";

export function useMerge(pullRequest: PullRequest) {
  const config = useConfig();
  return async () => merge(config, pullRequest);
}
