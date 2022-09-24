import { Action, ActionPanel, Cache, Color, getPreferenceValues, Icon, List } from "@raycast/api";
import { countBy, groupBy, keyBy, sortBy, sum, takeRight } from "lodash";
import fetch from "node-fetch";
import { useState, useEffect } from "react";
export const { url, user, password } = getPreferenceValues();

interface ResultPage {
  isLastPage: boolean;
  nextPageStart: number;
  values: Repository[];
}

interface Repository {
  id: number;
  name: string;
  slug: string;
  project: {
    key: string;
    name: string;
  };
  links?: {
    self: {
      href: string;
    }[];
  };
}

interface CacheData {
  lastModified: number;
  repositories: Repository[];
}

const cache = new Cache();
const lastUsedCacheKey = "bitbucket-server-last-used";

async function loadRepositoryPage(start = 0): Promise<ResultPage> {
  const result = await fetch(`${url}/rest/api/1.0/repos?limit=1000&start=${start}`, {
    headers: {
      Authorization: "Basic " + Buffer.from(user + ":" + password).toString("base64"),
    },
  });
  const data = await result.json();
  return data as ResultPage;
}

async function loadAllRepositories(): Promise<Repository[]> {
  let start = 0;
  let results: Repository[] = [];
  let isLastPage = false;
  while (!isLastPage) {
    const page = await loadRepositoryPage(start);
    isLastPage = page.isLastPage;
    start = page.nextPageStart;
    results = [...results, ...page.values];
  }
  return results;
}

function getLastUsedCache(): string[] {
  return JSON.parse(cache.get(lastUsedCacheKey) ?? "[]");
}

function getMostUsed() {
  const values = getLastUsedCache();
  const countEntries = Object.entries(countBy(values));
  const sortedEntries = sortBy(countEntries, (entry) => entry[1])
    .reverse()
    .map(([href]) => href);
  return sortedEntries.slice(0, 20);
}

async function updateLastUsed(href: string) {
  const cachedEntries = getLastUsedCache();
  const newEntries = [...cachedEntries, href];
  const latestEntries = takeRight(newEntries, 100);

  cache.set(lastUsedCacheKey, JSON.stringify(latestEntries));
}

function toKeywords(value: string): string[] {
  return value.toLowerCase().split(/[- _]/);
}

const searchScoreFor = (queryParts: string[], repository: Repository): number => {
  const keywords = toKeywords(repository.name);
  const allPartsMatch = queryParts.every((part) => keywords.some((keyword) => keyword.includes(part)));
  if (!allPartsMatch) {
    return -1;
  }

  const keywordScores = keywords.map((keyword) => {
    const part = queryParts.find((part) => keyword.includes(part));
    return part ? part.length / keyword.length : 0;
  });

  return sum(keywordScores) / keywords.length;
};

const search = (query: string, data: Repository[]): Repository[] => {
  const queryParts = toKeywords(query);
  const withScore = data
    .map((entry) => ({
      ...entry,
      score: searchScoreFor(queryParts, entry),
    }))
    .filter((entry) => entry.score > 0);

  const sorted = sortBy(withScore, (entry) => entry.score).reverse();
  return sorted.slice(0, 20);
};

async function cachedRepositories(): Promise<Repository[]> {
  const cacheKey = "bitbucket-server";
  const data = cache.get(cacheKey);
  const parsedData: CacheData | undefined = data === undefined ? undefined : JSON.parse(data);
  const now = new Date().getTime();

  if (parsedData !== undefined && now - parsedData.lastModified < 1000 * 60 * 60 * 24) {
    return parsedData.repositories;
  }

  const repositories = await loadAllRepositories();
  cache.set(
    cacheKey,
    JSON.stringify({
      lastModified: now,
      repositories,
    } as CacheData)
  );
  return repositories;
}

const useData = () => {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [searchResults, setSearchResults] = useState<Repository[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    cachedRepositories()
      .then(setRepositories)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (query) {
      setSearchResults(search(query, repositories));
    } else {
      const mostUsed = getMostUsed();
      const byUrl = keyBy(repositories, (repository) => repository.links?.self?.[0]?.href);
      const filtered = mostUsed
        .map((href) => byUrl[href])
        .filter((repository): repository is Repository => !!repository);
      setSearchResults(filtered);
    }
  }, [query, repositories]);

  return { searchResults, setQuery, loading };
};

export default function ListRepositories() {
  const { searchResults, setQuery, loading } = useData();

  return (
    <List
      isLoading={loading}
      enableFiltering={false}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search Bitbucket..."
      throttle
    >
      <List.Section title="Results">
        {(searchResults ?? []).map((searchResult) => (
          <SearchListItem key={searchResult.id} item={searchResult} />
        ))}
      </List.Section>
    </List>
  );
}

function renderActionsPanel(href: string | undefined) {
  if (href === undefined) {
    return null;
  }

  return (
    <ActionPanel>
      <ActionPanel.Section>
        {<Action.OpenInBrowser onOpen={updateLastUsed} title="Open" url={href} />}
        {
          <Action.OpenInBrowser
            onOpen={updateLastUsed}
            title="Pull Requests"
            url={href.replace(/\/browse$/, "/pull-requests")}
          />
        }
        {<Action.OpenInBrowser onOpen={updateLastUsed} title="Commits" url={href.replace(/\/browse$/, "/commits")} />}
        {<Action.OpenInBrowser onOpen={updateLastUsed} title="Branches" url={href.replace(/\/browse$/, "/branches")} />}
        {<Action.OpenInBrowser onOpen={updateLastUsed} title="Builds" url={href.replace(/\/browse$/, "/builds")} />}
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function SearchListItem({ item }: { item: Repository }) {
  return (
    <List.Item
      title={item.name}
      subtitle={item.slug}
      icon={{
        source: Icon.Box,
        tintColor: Color.Blue,
      }}
      actions={renderActionsPanel(item.links?.self?.[0]?.href)}
    />
  );
}
