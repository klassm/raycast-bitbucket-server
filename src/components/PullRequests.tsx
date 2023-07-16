import { Action, ActionPanel, Color, Icon, List } from "@raycast/api";
import { sortBy } from "lodash";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { FC } from "react";

interface PullRequestProps {
  loading: boolean;
  pullRequests: PullRequest[] | undefined;
}

export const PullRequests: FC<PullRequestProps> = ({ loading, pullRequests }) => {
  const pullRequestsToDisplay = sortBy(pullRequests ?? [], pr => pr.updatedDate).reverse();
  return (
    <List
      isLoading={loading}
      enableFiltering={true}
      isShowingDetail={true}
      searchBarPlaceholder="Search Pull Requests..."
      throttle
    >
      {(pullRequestsToDisplay).map((searchResult) => (
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
  Repository: ${pullRequest.repositoryName}
  Author: ${pullRequest.author.displayName}
  Created: ${new Date(pullRequest.createdDate).toLocaleString()}
  Updated: ${new Date(pullRequest.updatedDate).toLocaleString()}
  \`\`\`
    
  ${pullRequest.description ?? ""}
  `;
  return <List.Item.Detail markdown={markdown} />;
};
