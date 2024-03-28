import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";
import fetch from "node-fetch";

export type PullRequestMergeStatus = "MERGED" | "ERROR";

interface MergeResponse {
  state: string;
}

function isAutoMergeResponse(response: unknown): response is MergeResponse {
  return !!(response as MergeResponse).state;
}

export async function merge(
  { user, password, url }: Config,
  { projectKey, repositorySlug, id, version }: PullRequest
): Promise<PullRequestMergeStatus | undefined> {
  const requestUrl = `${url}/rest/api/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/merge?version=${version}`;
  const response = await fetch(requestUrl, {
    method: "POST",
    headers: {
      Authorization: "Basic " + Buffer.from(user + ":" + password).toString("base64"),
      "X-Atlassian-Token": "no-check",
    },
  });

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
