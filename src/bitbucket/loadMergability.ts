import fetch from "node-fetch";
import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";

export interface Mergeable {
  conflicted: boolean;
  canMerge: boolean;
}

function isMergableResponse(value: unknown): value is Mergeable {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const asAny = value as any;
  return (
    asAny.conflicted !== undefined &&
    asAny.canMerge !== undefined &&
    typeof asAny.conflicted === "boolean" &&
    typeof asAny.canMerge === "boolean"
  );
}

export async function loadIsMergeable({ user, token, url }: Config, { projectKey, repositorySlug, id }: PullRequest) {
  const requestUrl = `${url}/rest/api/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/merge`;
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const result = await response.json();
    if (!isMergableResponse(result)) {
      console.log("Weird merge status response from Bitbucket", result, response.status, response.statusText);
      return undefined;
    }

    return result;
  } catch (e) {
    console.log("error", e);
    return undefined;
  }
}
