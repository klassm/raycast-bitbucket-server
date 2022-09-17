import { Action, ActionPanel, Cache, Color, getPreferenceValues, Icon, List } from "@raycast/api";
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
  repositories: Repository[]
}

const cache = new Cache();

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

async function cachedRepositories(): Promise<Repository[]> {
  const cacheKey = "bitbucket-server";
  const data = cache.get(cacheKey);
  const parsedData: CacheData | undefined = data === undefined ? undefined : JSON.parse(data);
  const now = new Date().getTime();

  if (parsedData !== undefined && now - parsedData.lastModified < 1000 * 60 * 60 * 24) {
    return parsedData.repositories;
  }

  const repositories = await loadAllRepositories();
  cache.set(cacheKey, JSON.stringify({
    lastModified: now,
    repositories
  } as CacheData));
  return repositories;
}

export default function ListRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>();
  useEffect(() => {
    cachedRepositories().then(setRepositories);
  }, [cachedRepositories]);

  return (
    <List isLoading={false} enableFiltering={true} searchBarPlaceholder="Search Bitbucket..." throttle>
      <List.Section title="Results">
        {(repositories ?? []).map((searchResult) => (
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
        {<Action.OpenInBrowser title="Open" url={href} />}
        {<Action.OpenInBrowser title="Pull Requests" url={href.replace(/\/browse$/, "/pull-requests")} />}
        {<Action.OpenInBrowser title="Commits" url={href.replace(/\/browse$/, "/commits")} />}
        {<Action.OpenInBrowser title="Branches" url={href.replace(/\/browse$/, "/branches")} />}
        {<Action.OpenInBrowser title="Builds" url={href.replace(/\/browse$/, "/builds")} />}
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
