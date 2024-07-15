import { PullRequest } from "../bitbucket/loadPullRequests";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";
import { BuildStats, loadBuildStats } from "../bitbucket/loadBuildStats";
import { keyBy } from "lodash";

export function useBuildStats(pullRequests: PullRequest[]): {
  buildStats: BuildStats | undefined;
  loading: boolean;
  reload: () => void;
} {
  const config = useConfig();
  const keyedPullRequests = keyBy(pullRequests, (pr) => pr.latestCommit);
  const hashes = Object.keys(keyedPullRequests);
  const { data, loading, reload } = useCache(
    `build-stats-${JSON.stringify(hashes)}`,
    async () => loadBuildStats(config, hashes),
    {
      expirationMillis: 1000 * 30,
    },
  );
  return { buildStats: data, loading, reload };
}
