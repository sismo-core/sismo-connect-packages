import { gql } from "@apollo/client";

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

export const getGroupFromIdQuery = gql`
  query getGroup($id: ID!) {
    group(id: $id) {
      id
      name
      description
      specs
      generationFrequency
      snapshots {
        timestamp
        dataUrl
      }
    }
  }
`;

export const getGroupFromNameQuery = gql`
  query getGroup($name: String!) {
    group(name: $name) {
      id
      name
      description
      specs
      generationFrequency
      snapshots {
        timestamp
        dataUrl
      }
    }
  }
`;
