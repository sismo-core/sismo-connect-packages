export type SupportedEnvs = "staging" | "testnets" | "prod";

export const sismoApiUrls: Record<SupportedEnvs, string> = {
  staging: "https://api.staging.zikies.io",
  testnets: "https://api.testnets.sismo.io",
  prod: "https://api.sismo.io",
};
