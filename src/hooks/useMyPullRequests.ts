import { loadMyPullRequests, loadProjectPullRequests } from "../bitbucket/loadPullRequests";
import { Repository } from "../types/Repository";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useMyPullRequests() {
  const config = useConfig();
  const { data, loading, reload } = useCache(`bitbucket-my-pull-requests`, async () => loadMyPullRequests(config), {
    expirationMillis: 1000 * 60,
  });
  return { pullRequests: data, loading, reload };
}
