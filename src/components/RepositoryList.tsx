import { Action, ActionPanel, Color, Icon, List, useNavigation } from "@raycast/api";
import { useSearch } from "../hooks/useSearch";
import { Repository } from "../types/Repository";
import { ProjectPullRequests } from "./ProjectPullRequests";

export const RepositoryList = () => {
  const { searchResults, setQuery, loading, updateMostUsed } = useSearch();

  return (
    <List
      isLoading={loading}
      enableFiltering={false}
      onSearchTextChange={setQuery}
      searchBarPlaceholder="Search Bitbucket..."
      throttle
    >
      {(searchResults ?? []).map((searchResult) => (
        <SearchListItem key={searchResult.id} item={searchResult} updateMostUsed={() => updateMostUsed(searchResult)} />
      ))}
    </List>
  );
};

const SearchItemsActionPanel = ({ item, updateMostUsed }: { item: Repository; updateMostUsed: () => void }) => {
  const { push } = useNavigation();
  const href = item.links?.self?.[0]?.href;
  if (href === undefined) {
    return null;
  }

  return (
    <ActionPanel>
      <ActionPanel.Section>
        <Action.OpenInBrowser onOpen={updateMostUsed} title="Open" url={href} />
        <Action
          title="Pull Requests"
          onAction={() => {
            updateMostUsed();
            push(<ProjectPullRequests repository={item} />);
          }}
        />
        <Action.OpenInBrowser onOpen={updateMostUsed} title="Commits" url={href.replace(/\/browse$/, "/commits")} />
        <Action.OpenInBrowser onOpen={updateMostUsed} title="Branches" url={href.replace(/\/browse$/, "/branches")} />
        <Action.OpenInBrowser onOpen={updateMostUsed} title="Builds" url={href.replace(/\/browse$/, "/builds")} />
      </ActionPanel.Section>
    </ActionPanel>
  );
};

const SearchListItem = ({ item, updateMostUsed }: { item: Repository; updateMostUsed: () => void }) => {
  const subtitle = item.name === item.slug ? undefined : item.slug;
  return (
    <List.Item
      title={item.name}
      subtitle={subtitle}
      accessories={[{ text: item.project.name }]}
      icon={{
        source: Icon.Box,
        tintColor: Color.Blue,
      }}
      actions={<SearchItemsActionPanel item={item} updateMostUsed={updateMostUsed} />}
    />
  );
};
