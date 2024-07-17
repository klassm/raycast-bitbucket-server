import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";
import fetch from "node-fetch";
import { accessRateLimited } from "./accessRateLimited";

export type PullRequestMergeStatus = "MERGED" | "ERROR";

interface MergeResponse {
  state: string;
}

function isAutoMergeResponse(response: unknown): response is MergeResponse {
  return !!(response as MergeResponse).state;
}

export async function merge(
  { token, url }: Config,
  { projectKey, repositorySlug, id, version }: PullRequest,
): Promise<PullRequestMergeStatus | undefined> {
  const requestUrl = `${url}/rest/api/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/merge?version=${version}`;
  const response = await accessRateLimited("merge", async () =>
    fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Atlassian-Token": "no-check",
      },
    }),
  );

  try {
    const result = await response.json();
    if (!isAutoMergeResponse(result)) {
      console.log("Weird auto merge response from Bitbucket", result, response.status, response.statusText);
      return undefined;
    }

    return result.state === "MERGED" ? "MERGED" : "ERROR";
  } catch (e) {
    console.log("error", e);
    return undefined;
  }
}
