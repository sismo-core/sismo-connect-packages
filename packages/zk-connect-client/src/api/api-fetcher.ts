import { ApolloClient, InMemoryCache, QueryOptions } from "@apollo/client";

export class ApiFetcher {
  private _url: string;
  private _client: ApolloClient<any>;

  constructor(sismoApiUrl: string) {
    this._url = sismoApiUrl;
    this._client = new ApolloClient({
      uri: this._url,
      cache: new InMemoryCache(),
    });
  }

  public async getWithQuery<T>(opts: QueryOptions) {
    const res = await this._client.query<T>(opts);
    return res.data;
  }
}
