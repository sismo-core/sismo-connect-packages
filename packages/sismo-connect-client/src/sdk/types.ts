export type GroupParams = { id?: string; name?: string; timestamp?: string };
export type FetchedData = Record<string, number>;

// queries types
export type GetGroupQueryOutput = {
  id: string;
  name: string;
  description: string;
  specs: string;
  generationFrequency: string;
  snapshots: {
    timestamp: string;
    dataUrl: string;
  }[];
};
