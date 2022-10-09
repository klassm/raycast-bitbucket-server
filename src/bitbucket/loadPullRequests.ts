import fetch from "node-fetch";
import { Config } from "../types/Config";
import { Repository } from "../types/Repository";

export interface PullRequest {
  id: number;
  title: string;
  description: string;
  state: string;
  author: User;
  reviewers: User[];
  href: string;
  createdDate: number;
  updatedDate: number;
}

interface User {
  name: string;
  emailAddress: string;
  displayName: string;
}

interface PullRequestResponseEntry {
  id: number;
  version: number;
  title: string;
  description: string;
  state: string;
  createdDate: number;
  updatedDate: number;
  author: {
    user: User;
  };
  reviewers: {
    user: User;
  }[];
  links: {
    self: { href: string }[];
  };
}

interface PullRequestResponse {
  size: number;
  limit: number;
  isLastPage: number;
  values: PullRequestResponseEntry[];
}

function isPullRequestResponse(value: unknown): value is PullRequestResponse {
  const response = value as PullRequestResponse;
  return response.limit > 0 && Array.isArray(response.values);
}

export async function loadPullRequests(
  { user, password, url }: Config,
  { slug, project }: Repository
): Promise<PullRequest[]> {
  const requestUrl = `${url}/rest/api/latest/projects/${project.key}/repos/${slug}/pull-requests`;
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: "Basic " + Buffer.from(user + ":" + password).toString("base64"),
    },
  });

  const result = await response.json();
  if (!isPullRequestResponse(result)) {
    console.log("Weird pull request response from Bitbucket", result, response.status);
    throw new Error(`Got a weird pull request response from Bitbucket: ${response.status} ${response.statusText}`);
  }

  return result.values.map((value) => ({
    id: value.id,
    title: value.title,
    description: value.description,
    state: value.state,
    createdDate: value.createdDate,
    updatedDate: value.updatedDate,
    reviewers: value.reviewers.map(({ user }) => user),
    author: value.author.user,
    href: value.links.self[0]?.href,
  }));
}
