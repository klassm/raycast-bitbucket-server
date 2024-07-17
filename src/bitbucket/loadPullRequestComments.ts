import fetch from "node-fetch";
import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";
import { accessRateLimited } from "./accessRateLimited";

export interface PullRequestComment {
  id: number;
  text: string;
  severity: "BLOCKER" | "NORMAL";
  state: "OPEN" | "APPLIED";
}

interface PullRequestCommentsResponseEntry {
  id: number;
  version: number;
  text: string;
  severity: "BLOCKER" | "NORMAL";
  state: "OPEN" | "APPLIED";
}

interface PullRequestCommentsResponse {
  size: number;
  limit: number;
  isLastPage: number;
  values: PullRequestCommentsResponseEntry[];
}

function isPullRequestResponse(value: unknown): value is PullRequestCommentsResponse {
  const response = value as PullRequestCommentsResponse;
  return response.limit > 0 && Array.isArray(response.values);
}

function mapPullRequestCommentsResponse(result: PullRequestCommentsResponse): PullRequestComment[] {
  return result.values.map((value) => ({
    id: value.id,
    text: value.text,
    severity: value.severity,
    state: value.state,
  }));
}

async function loadPullRequestComments(requestUrl: string, token: string) {
  const response = await accessRateLimited("comments", async () =>
    fetch(requestUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );

  const result = await response.json();
  if (!isPullRequestResponse(result)) {
    console.log("Weird pull request comments response from Bitbucket", result, response.status, response.statusText);
    return [];
  }

  return mapPullRequestCommentsResponse(result);
}

export async function loadPullRequestsComments(
  { token, url }: Config,
  { projectKey, repositorySlug, id }: PullRequest,
): Promise<PullRequestComment[]> {
  const requestUrl = `${url}/rest/api/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/blocker-comments`;
  return loadPullRequestComments(requestUrl, token);
}
