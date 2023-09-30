import { Action, ActionPanel, Color, Icon, Image, List } from "@raycast/api";
import { sortBy } from "lodash";
import { FC } from "react";
import { BuildStatus } from "../bitbucket/loadBuildStatus";
import { Mergeable } from "../bitbucket/loadMergability";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { useBuildStatus } from "../hooks/useBuildStatus";
import { useMergeable } from "../hooks/useMergeable";

interface PullRequestProps {
  loading: boolean;
  pullRequests: PullRequest[] | undefined;
}

export const PullRequests: FC<PullRequestProps> = ({ loading, pullRequests }) => {
  const pullRequestsToDisplay = sortBy(pullRequests ?? [], (pr) => pr.updatedDate).reverse();
  return (
    <List
      isLoading={loading}
      enableFiltering={true}
      isShowingDetail={true}
      searchBarPlaceholder="Search Pull Requests..."
      throttle
    >
      {pullRequestsToDisplay.map((searchResult) => (
        <PullRequestItem key={searchResult.id} pullRequest={searchResult} />
      ))}
    </List>
  );
};

const getIcon = (buildStatus: BuildStatus | undefined, mergeable: Mergeable | undefined): Image.ImageLike => {
  if (mergeable?.canMerge === true) {
    return {
      source: Icon.Checkmark,
      tintColor: Color.Green,
      mask: Image.Mask.Circle,
    };
  }
  if (mergeable?.conflicted === true) {
    return {
      source: Icon.Exclamationmark,
      tintColor: Color.Yellow,
      mask: Image.Mask.Circle,
    };
  }
  if (buildStatus?.state === "SUCCESSFUL") {
    return "build_success.png";
  }
  if (buildStatus?.state === "FAILED") {
    return "build_failure.png";
  }
  if (buildStatus?.state === 'INPROGRESS') {
    return {
      source: Icon.CircleProgress50,
      tintColor: Color.Blue,
      mask: Image.Mask.Circle,
    };
  }
  return {
    source: Icon.Box,
    tintColor: Color.Blue,
  };
};

const PullRequestItem: FC<{ pullRequest: PullRequest }> = ({ pullRequest }) => {
  const { buildStatus } = useBuildStatus(pullRequest);
  const { mergeable } = useMergeable(pullRequest);
  const subtitle = `${pullRequest.author.displayName}, updated ${new Date(pullRequest.updatedDate).toLocaleString()}`;
  return (
    <List.Item
      title={pullRequest.title}
      subtitle={subtitle}
      detail={<PullRequestItemDetail pullRequest={pullRequest} buildStatus={buildStatus} mergeable={mergeable} />}
      icon={getIcon(buildStatus, mergeable)}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser icon={{ source: Icon.Link }} title="Open in browser" url={pullRequest.href} />
            {buildStatus && (
              <Action.OpenInBrowser icon={{ source: Icon.Stopwatch }} title="Build Status" url={buildStatus.url} />
            )}
          </ActionPanel.Section>
        </ActionPanel>
      }
    />
  );
};

function booleanToYesNo(value?: boolean): string {
  if (value === undefined) {
    return "unknown";
  }
  return value ? "yes" : "no";
}

const PullRequestItemDetail: FC<{ pullRequest: PullRequest; buildStatus?: BuildStatus; mergeable?: Mergeable }> = ({
  pullRequest,
  buildStatus,
  mergeable,
}) => {
  const markdown = `
  ## ${pullRequest.title}
  \`\`\`
  Repository: ${pullRequest.repositoryName}
  Author: ${pullRequest.author.displayName}
  Created: ${new Date(pullRequest.createdDate).toLocaleString()}
  Updated: ${new Date(pullRequest.updatedDate).toLocaleString()}
  Status: ${buildStatus === undefined ? "unknown" : buildStatus.state}
  Conflicted: ${booleanToYesNo(mergeable?.conflicted)}
  Mergeable: ${booleanToYesNo(mergeable?.canMerge)}
  \`\`\`
    
  ${pullRequest.description ?? ""}
  `;
  return <List.Item.Detail markdown={markdown} />;
};
