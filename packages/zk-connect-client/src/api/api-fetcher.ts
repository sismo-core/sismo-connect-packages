
export type QueryOptions = {
  query: string;
  variables?: any;
}

export class ApiFetcher {
  private _url: string;

  constructor(url: string) {
    this._url = url;
  }

  public async getWithQuery<T>(opts: QueryOptions) {
    return await fetch(this._url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: opts.query,
        variables: opts.variables,
      }),
    })
    .then(res => res.json())
    .then(res => res.data)
  }
}
