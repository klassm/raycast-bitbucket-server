import { useProjectPullRequests } from "../hooks/useProjectPullRequests";
import { Repository } from "../types/Repository";
import { FC } from "react";
import { PullRequests } from "./PullRequests";

interface PullRequestProps {
  repository: Repository;
}

export const ProjectPullRequests: FC<PullRequestProps> = ({ repository }) => {
  const { loading, pullRequests } = useProjectPullRequests(repository);

  return <PullRequests loading={loading} pullRequests={pullRequests} />;
};
