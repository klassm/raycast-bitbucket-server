import { useMyPullRequests } from "../hooks/useMyPullRequests";
import { FC } from "react";
import { PullRequests } from "./PullRequests";

export const MyPullRequests: FC = () => {
  const { loading, pullRequests } = useMyPullRequests();

  return <PullRequests loading={loading} pullRequests={pullRequests} />;
};
