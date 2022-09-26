import { sortBy, sum } from "lodash";
import { useEffect, useState } from "react";
import { Repository } from "../types/Repository";
import { useMostUsed } from "./useMostUsed";
import { useRepositories } from "./useRepositories";

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

export function useSearch() {
  const { repositories = [], loading } = useRepositories();
  const [searchResults, setSearchResults] = useState<Repository[]>([]);
  const [query, setQuery] = useState("");
  const { mostUsed, add: updateMostUsed } = useMostUsed();

  useEffect(() => {
    if (query) {
      setSearchResults(search(query, repositories));
    } else {
      setSearchResults(mostUsed);
    }
  }, [query, repositories]);

  return { loading, searchResults, setQuery, updateMostUsed };
}
