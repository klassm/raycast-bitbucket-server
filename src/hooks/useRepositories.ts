import { loadRepositories } from "../bitbucket/loadRepositories";
import { useCache } from "./useCache";
import { useConfig } from "./useConfig";

export function useRepositories() {
  const config = useConfig();
  const {
    data,
    loading
  } = useCache("bitbucket-repositories", async () => loadRepositories(config), { expirationMillis: 1000 * 60 * 60 * 24 })
  return { repositories: data, loading }
}
