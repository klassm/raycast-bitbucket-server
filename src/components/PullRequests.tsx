import { Action, ActionPanel, Color, Icon, Image, List, showToast, Toast } from "@raycast/api";
import { pull, sortBy } from "lodash";
import { FC, useMemo, useState } from "react";
import { Mergeable } from "../bitbucket/loadMergability";
import { PullRequestComment } from "../bitbucket/loadPullRequestComments";
import { PullRequest } from "../bitbucket/loadPullRequests";
import { usePullRequestComments } from "../hooks/usePullRequestComments";
import { useMerge } from "../hooks/useMerge";
import { useApprove } from "../hooks/useApprove";
import { useConfig } from "../hooks/useConfig";
import { useBuildStats } from "../hooks/useBuildStats";
import { BuildStatus } from "../bitbucket/loadBuildStats";
import { useMergeable } from "../hooks/useMergeable";

interface PullRequestProps {
  loading: boolean;
  pullRequests: PullRequest[] | undefined;
  reload: () => Promise<void>;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-zA-Z0-9]/g, "");
}

export const PullRequests: FC<PullRequestProps> = ({ loading, pullRequests, reload }) => {
  const [filter, setFilter] = useState<string>("");
  const pullRequestsToDisplay = useMemo(() => {
    const normalizedFilter = normalize(filter);
    const filtered = (pullRequests ?? []).filter(
      (pr) =>
        normalize(pr.title).includes(normalizedFilter) ||
        normalize(pr.repositoryName).includes(normalizedFilter) ||
        normalize(pr.author.displayName).includes(normalizedFilter),
    );
    return sortBy(filtered, (pr) => pr.updatedDate).reverse();
  }, [pullRequests, filter]);
  const { buildStats } = useBuildStats(pullRequests ?? []) ?? {};
  return (
    <List
      isLoading={loading}
      onSearchTextChange={setFilter}
      isShowingDetail={true}
      searchBarPlaceholder="Search Pull Requests..."
      throttle
    >
      {pullRequestsToDisplay.map((pullRequest) => (
        <PullRequestItem
          key={pullRequest.id + "_" + pullRequest.repositorySlug}
          pullRequest={pullRequest}
          reloadPullRequests={reload}
          buildStatus={buildStats?.[pullRequest.latestCommit] as BuildStatus | undefined}
        />
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
  if (buildStatus === "SUCCESSFUL") {
    return "build_success.png";
  }
  if (buildStatus === "FAILED") {
    return "build_failure.png";
  }
  if (buildStatus === "INPROGRESS") {
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

const PullRequestItem: FC<{
  pullRequest: PullRequest;
  reloadPullRequests: () => Promise<void>;
  buildStatus: BuildStatus | undefined;
}> = ({ pullRequest, reloadPullRequests, buildStatus }) => {
  const { mergeable, reload: reloadMergable } = useMergeable(pullRequest);
  const { comments, reload: reloadComments } = usePullRequestComments(pullRequest);
  const merge = useMerge(pullRequest);
  const { approve, approved, approvedByUser } = useApprove(pullRequest);

  const reload = async () => {
    await Promise.all([reloadMergable(), reloadComments()]);
    await reloadPullRequests();
  };

  const actionApprove = async () => {
    const result = await approve();
    if (result) {
      await showToast({ style: Toast.Style.Success, title: "Approve", message: "Approved" });
      return true;
    } else {
      await showToast({ style: Toast.Style.Failure, title: "Approve", message: "Could not approve." });
      return false;
    }
  };

  const actionMerge = async () => {
    const result = await merge();
    if (result === undefined || result !== "MERGED") {
      await showToast({
        style: Toast.Style.Failure,
        title: "Merge",
        message: `Could not merge. Reason: ${result ?? "UNKNOWN"}`,
      });
      void reload();
    } else {
      void reload();
      await showToast({ style: Toast.Style.Success, title: "Merge", message: "Merged" });
    }
  };

  const subtitle = `${pullRequest.author.displayName}, updated ${new Date(pullRequest.updatedDate).toLocaleString()}`;
  return (
    <List.Item
      title={pullRequest.title}
      subtitle={subtitle}
      detail={
        <PullRequestItemDetail
          approved={approved}
          approvedByUser={approvedByUser}
          pullRequest={pullRequest}
          buildStatus={buildStatus}
          mergeable={mergeable}
          comments={comments}
        />
      }
      icon={getIcon(buildStatus, mergeable)}
      actions={
        <ActionPanel>
          <ActionPanel.Section>
            <Action.OpenInBrowser icon={{ source: Icon.Link }} title="Open in browser" url={pullRequest.href} />
            {mergeable?.canMerge && (
              <Action icon={{ source: Icon.Anchor }} title="Merge" onAction={async () => actionMerge()} />
            )}
            {!approvedByUser && (
              <Action
                icon={{ source: Icon.Checkmark }}
                title="Approve"
                onAction={async () => {
                  await actionApprove();
                  void reload();
                }}
              />
            )}
            {!approvedByUser && (
              <Action
                icon={{ source: Icon.Checkmark }}
                title="Approve & Merge"
                onAction={async () => {
                  if (await actionApprove()) {
                    await reloadMergable();
                    await actionMerge();
                  }
                }}
              />
            )}

            <Action icon={{ source: Icon.Download }} title="Reload" onAction={reload} />
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

const PullRequestItemDetail: FC<{
  pullRequest: PullRequest;
  buildStatus?: BuildStatus;
  mergeable?: Mergeable;
  comments?: PullRequestComment[];
  approved: boolean;
  approvedByUser: boolean;
}> = ({ pullRequest, comments, buildStatus, mergeable, approved, approvedByUser }) => {
  const openTasks = useMemo(
    () => comments?.filter((comment) => comment.state === "OPEN" && comment.severity === "BLOCKER")?.length,
    [comments],
  );
  const { user } = useConfig();

  const markdown = `
  ## ${pullRequest.title}
  \`\`\`
  Repository: ${pullRequest.repositoryName}
  Author: ${pullRequest.author.displayName}
  Created: ${new Date(pullRequest.createdDate).toLocaleString()}
  Updated: ${new Date(pullRequest.updatedDate).toLocaleString()}
  Status: ${buildStatus === undefined ? "unknown" : buildStatus}
  Conflicted: ${booleanToYesNo(mergeable?.conflicted)}
  Mergeable: ${booleanToYesNo(mergeable?.canMerge)}
  Approved: ${booleanToYesNo(approved)} (${user}: ${booleanToYesNo(approvedByUser)})
  Tasks: ${openTasks ?? "??"}
  \`\`\`
    
  ${pullRequest.description ?? ""}
  `;
  return <List.Item.Detail markdown={markdown} />;
};
