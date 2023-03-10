import { ApiFetcher, SupportedEnvs } from "../api";
import { getGroupFromIdQuery, getGroupFromNameQuery, GetGroupQueryOutput } from "./queries";

type GroupParams = { id?: string; name?: string; timestamp?: string };
export type FetchedData = Record<string, number>;

export class Sdk {
  private apiFetcher: ApiFetcher;

  constructor(env?: SupportedEnvs) {
    this.apiFetcher = new ApiFetcher(env);
  }

  public async getGroup({ id, name, timestamp }: GroupParams) {
    if (!id && !name) {
      throw new Error(
        "Either id or name must be provided for the group. You can view all groups at https://factory.sismo.io/groups-explorer."
      );
    }

    const group: GetGroupQueryOutput = id
      ? (
          await this.apiFetcher.getWithQuery<{ group: GetGroupQueryOutput }>({
            query: getGroupFromIdQuery,
            variables: { id },
          })
        ).group
      : (
          await this.apiFetcher.getWithQuery<{ group: GetGroupQueryOutput }>({
            query: getGroupFromNameQuery,
            variables: { name },
          })
        ).group;

    let dataUrl: string;
    if (timestamp) {
      const snapshot = group.snapshots.filter(
        (s: { timestamp: string }) => s.timestamp === timestamp
      )[0];
      ({ dataUrl } = snapshot);
      if (!snapshot) {
        ({ dataUrl } = group.snapshots[0]);
      }
    } else {
      ({ dataUrl } = group.snapshots[0]);
    }

    const data: FetchedData = await fetch(dataUrl).then((res) => res.json());
    return { ...group, data };
  }
}
