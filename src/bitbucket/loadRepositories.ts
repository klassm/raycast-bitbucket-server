import fetch from "node-fetch";
import { Config } from "../types/Config";
import { Repository } from "../types/Repository";

interface ResultPage {
  isLastPage: boolean;
  nextPageStart: number;
  values: Repository[];
}

async function loadRepositoryPage(start = 0, { token, url }: Config): Promise<ResultPage> {
  const result = await fetch(`${url}/rest/api/1.0/repos?limit=1000&start=${start}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await result.json();
  return data as ResultPage;
}

export async function loadRepositories(config: Config): Promise<Repository[]> {
  let start = 0;
  let results: Repository[] = [];
  let isLastPage = false;
  while (!isLastPage) {
    const page = await loadRepositoryPage(start, config);
    isLastPage = page.isLastPage;
    start = page.nextPageStart;
    results = [...results, ...page.values];
  }
  return results;
}
