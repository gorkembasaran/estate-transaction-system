export function createAppUrls(host: string, port: number, apiPrefix?: string) {
  const displayHost = host === '0.0.0.0' ? '127.0.0.1' : host;
  const rootUrl = `http://${displayHost}:${port}`;

  return {
    apiBaseUrl: apiPrefix ? `${rootUrl}/${apiPrefix}` : rootUrl,
    rootUrl,
  };
}
