export const getGroupFromIdQuery = `
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

export const getGroupFromNameQuery = `
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
