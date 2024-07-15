import { pick } from "lodash";
import fetch from "node-fetch";
import { Config } from "../types/Config";
import { PullRequest } from "./loadPullRequests";

export interface BuildStatus {
  state: string;
  url: string;
}

interface BuildStatusResponseEntry {
  state: string;
  url: string;
}

interface BuildStatusResponse {
  page: {
    values: BuildStatusResponseEntry[];
  };
}

function isBuildStatusResponse(value: unknown): value is BuildStatusResponse {
  const response = value as BuildStatusResponse;
  return Array.isArray(response.page.values);
}

function mapBuildStatusResponse(result: BuildStatusResponse): BuildStatus | undefined {
  const entry = result.page.values[0];
  return entry === undefined ? undefined : pick(entry, "state", "url");
}

export async function loadBuildStatus({ token, url }: Config, { projectKey, repositorySlug, id }: PullRequest) {
  const requestUrl = `${url}/rest/ui/latest/projects/${projectKey}/repos/${repositorySlug}/pull-requests/${id}/builds?size=1`;
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  try {
    const result = await response.json();
    if (!isBuildStatusResponse(result)) {
      console.log("Weird build status response from Bitbucket", result, response.status, response.statusText);
      return undefined;
    }

    return mapBuildStatusResponse(result);
  } catch (e) {
    console.log("error", e);
    return undefined;
  }
}
