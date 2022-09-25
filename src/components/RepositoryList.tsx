import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { useSearch } from "../hooks/useSearch";
import { Repository } from "../types/Repository";

export function RepositoryList() {
  const { searchResults, setQuery, loading, updateMostUsed } = useSearch();

  return (
    <List
      isLoading={ loading }
      enableFiltering={ false }
      onSearchTextChange={ setQuery }
      searchBarPlaceholder="Search Bitbucket..."
      throttle
    >
      <List.Section title="Results">
        { ( searchResults ?? [] ).map((searchResult) => (
          <SearchListItem key={ searchResult.id } item={ searchResult }
                          updateMostUsed={ () => updateMostUsed(searchResult) }/>
        )) }
      </List.Section>
    </List>
  );
}

function SearchItemsActionPanel({ href, updateMostUsed }: { href: string | undefined, updateMostUsed: () => void }) {
  if (href === undefined) {
    return null;
  }

  return (
    <ActionPanel>
      <ActionPanel.Section>
        { <Action.OpenInBrowser onOpen={ updateMostUsed } title="Open" url={ href }/> }
        {
          <Action.OpenInBrowser
            onOpen={ updateMostUsed }
            title="Pull Requests"
            url={ href.replace(/\/browse$/, "/pull-requests") }
          />
        }
        { <Action.OpenInBrowser onOpen={ updateMostUsed } title="Commits"
                                url={ href.replace(/\/browse$/, "/commits") }/> }
        { <Action.OpenInBrowser onOpen={ updateMostUsed } title="Branches"
                                url={ href.replace(/\/browse$/, "/branches") }/> }
        { <Action.OpenInBrowser onOpen={ updateMostUsed } title="Builds"
                                url={ href.replace(/\/browse$/, "/builds") }/> }
      </ActionPanel.Section>
    </ActionPanel>
  );
}

function SearchListItem({ item, updateMostUsed }: { item: Repository, updateMostUsed: () => void }) {
  return (
    <List.Item
      title={ item.name }
      subtitle={ item.slug }
      icon={ {
        source: Icon.Box,
        tintColor: Color.Blue,
      } }
      actions={ <SearchItemsActionPanel href={ item.links?.self?.[0]?.href } updateMostUsed={ updateMostUsed }/> }
    />
  );
}
