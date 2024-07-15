import { getPreferenceValues } from "@raycast/api";
import { Config } from "../types/Config";

export function useConfig(): Config {
  const { url, user, token } = getPreferenceValues();
  return {
    url,
    user,
    token,
  };
}
