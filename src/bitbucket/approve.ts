import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";
import fetch from "node-fetch";
import { accessRateLimited } from "./accessRateLimited";

interface ApproveResponse {
  approved: boolean;
}

function isAutoMergeResponse(response: unknown): response is ApproveResponse {
  return (response as ApproveResponse)?.approved;
}

export async function approve(
  { token, user, url }: Config,
  { projectKey, repositorySlug, id, version }: PullRequest,
): Promise<boolean> {
  const requestUrl = `${url}/rest/api/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/participants/${user}?version=${version}`;
  const response = await accessRateLimited("approve", async () =>
    fetch(requestUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-Atlassian-Token": "no-check",
      },
      body: JSON.stringify({
        status: "APPROVED",
      }),
    }),
  );

  try {
    const result = response.status === 200 ? await response.json() : undefined;
    if (!isAutoMergeResponse(result)) {
      console.log("Weird auto merge response from Bitbucket", result, response.status, response.statusText);
      return false;
    }
    return result.approved;
  } catch (e) {
    console.log("error", e);
    return false;
  }
}
