import { mapValues } from "lodash";
import fetch from "node-fetch";
import { Config } from "../types/Config";
import { accessRateLimited } from "./accessRateLimited";

export type BuildStatus = "SUCCESSFUL" | "FAILED" | "INPROGRESS" | "UNKNOWN";

export interface BuildStats {
  [gitHash: string]: BuildStatus;
}

interface BuildStatusResponse {
  [gitHash: string]: {
    cancelled: number;
    successful: number;
    inProgress: number;
    failed: number;
    unknown: 0;
  };
}

function isBuildStatsResponse(value: unknown): value is BuildStatusResponse {
  const response = value as BuildStatusResponse;
  return typeof response === "object";
}

function mapBuildStatusResponse(result: BuildStatusResponse): BuildStats | undefined {
  return mapValues(result, ({ successful, inProgress, failed }): BuildStatus => {
    if (inProgress > 0) {
      return "INPROGRESS";
    }
    if (successful > 0) {
      return "SUCCESSFUL";
    }
    if (failed > 0) {
      return "FAILED";
    }
    return "UNKNOWN";
  });
}

export async function loadBuildStats({ token, url }: Config, gitHashes: string[]) {
  if (gitHashes.length === 0) {
    return undefined;
  }
  const requestUrl = `${url}/rest/build-status/1.0/commits/stats`;
  const requestBody = JSON.stringify(gitHashes);
  const response = await accessRateLimited("loadBuildStats", async () =>
    fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: requestBody,
    }),
  );

  try {
    const result = await response.json();
    console.log("result build stats", result);
    if (!isBuildStatsResponse(result)) {
      console.log(
        "Weird build stats response from Bitbucket",
        result,
        response.status,
        response.statusText,
        requestBody,
      );
      return undefined;
    }

    return mapBuildStatusResponse(result);
  } catch (e) {
    console.log("loadBuildStats error", e);
    return undefined;
  }
}
