import fetch from "node-fetch";
import { Config } from "../types/Config";
import { Repository } from "../types/Repository";

export interface PullRequest {
  id: number;
  version: number;
  title: string;
  description: string;
  state: string;
  author: User;
  reviewers: Reviewer[];
  href: string;
  createdDate: number;
  updatedDate: number;
  repositoryName: string;
  repositorySlug: string;
  projectKey: string;
}

interface User {
  name: string;
  emailAddress: string;
  displayName: string;
}

interface Reviewer {
  user: User;
  approved: boolean;
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
  reviewers: Reviewer[];
  links: {
    self: { href: string }[];
  };
  toRef: {
    repository: {
      name: string;
      slug: string;
      project: { key: string };
    };
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

function mapPullRequestResponse(result: PullRequestResponse): PullRequest[] {
  return result.values.map((value) => ({
    id: value.id,
    version: value.version,
    title: value.title,
    description: value.description,
    state: value.state,
    createdDate: value.createdDate,
    updatedDate: value.updatedDate,
    reviewers: value.reviewers,
    author: value.author.user,
    href: value.links.self[0]?.href,
    repositoryName: value.toRef.repository.name,
    repositorySlug: value.toRef.repository.slug,
    projectKey: value.toRef.repository.project.key,
  }));
}

async function loadPullRequests(requestUrl: string, token: string) {
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();
  if (!isPullRequestResponse(result)) {
    console.log("Weird pull request response from Bitbucket", result, response.status, response.statusText);
    throw new Error(`Got a weird pull request response from Bitbucket: ${response.status} ${response.statusText}`);
  }

  return mapPullRequestResponse(result);
}

export async function loadProjectPullRequests(
  { user, token, url }: Config,
  { slug, project }: Repository,
): Promise<PullRequest[]> {
  const requestUrl = `${url}/rest/api/latest/projects/${project.key}/repos/${slug}/pull-requests?limit=1000`;
  return loadPullRequests(requestUrl, token);
}

export async function loadMyPullRequests({ user, token, url }: Config): Promise<PullRequest[]> {
  const requestUrl = `${url}/rest/api/latest/dashboard/pull-requests?state=OPEN&limit=1000`;
  return loadPullRequests(requestUrl, token);
}
