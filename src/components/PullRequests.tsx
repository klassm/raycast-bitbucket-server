import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { usePullRequests } from "../hooks/usePullRequests";
import { Repository } from "../types/Repository";
import { FC } from "react";

interface PullRequestProps {
  repository: Repository;
}

export const PullRequests: FC<PullRequestProps> = ({ repository }) => {
  const { loading, pullRequests } = usePullRequests(repository);

  return (
    <List
      isLoading={loading}
      enableFiltering={true}
      isShowingDetail={true}
      searchBarPlaceholder="Search Pull Requests..."
      throttle
    >
      {(pullRequests ?? []).map((searchResult) => (
        <PullRequestItem key={searchResult.id} pullRequest={searchResult} />
      ))}
    </List>
  );
};

const PullRequestItem: FC<{ pullRequest: PullRequest }> = ({ pullRequest }) => {
  const subtitle = `${pullRequest.author.displayName}, updated ${new Date(pullRequest.updatedDate).toLocaleString()}`;
  return (
    <List.Item
      title={pullRequest.title}
      subtitle={subtitle}
      detail={<PullRequestItemDetail pullRequest={pullRequest} />}
      icon={{
        source: Icon.Box,
        tintColor: Color.Blue,
      }}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser icon={{ source: Icon.Link }} title="Open in browser" url={pullRequest.href} />
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};

const PullRequestItemDetail: FC<{ pullRequest: PullRequest }> = ({ pullRequest }) => {
  const markdown = `
  ## ${pullRequest.title}
  \`\`\`
  Author: ${pullRequest.author.displayName}
  Created: ${new Date(pullRequest.createdDate).toLocaleString()}
  Updated: ${new Date(pullRequest.updatedDate).toLocaleString()}
  \`\`\`
    
  ${pullRequest.description ?? ""}
  `;
  return <List.Item.Detail markdown={markdown} />;
};
