import { ApiFetcher, sismoApiUrls } from "../api";
import { getGroupFromIdQuery, getGroupFromNameQuery } from "./queries";
import { FetchedData, GetGroupQueryOutput, GroupParams } from "./types";

export class Sdk {
  private _apiFetcher: ApiFetcher;

  constructor(sismoApiUrl?: string) {
    this._apiFetcher = new ApiFetcher(sismoApiUrl ?? sismoApiUrls.prod);
  }
  
  public async getGroup({ id, name, timestamp }: GroupParams) {
    if (!id && !name) {
      throw new Error(
        "Either id or name must be provided for the group. You can view all groups at https://factory.sismo.io/groups-explorer."
      );
    }

    const group: GetGroupQueryOutput = id
      ? (
          await this._apiFetcher.getWithQuery<{ group: GetGroupQueryOutput }>({
            query: getGroupFromIdQuery,
            variables: { id },
          })
        ).group
      : (
          await this._apiFetcher.getWithQuery<{ group: GetGroupQueryOutput }>({
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
    return { ...group, data } as GetGroupQueryOutput & { data: FetchedData };
  }
}
