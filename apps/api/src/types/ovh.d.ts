declare module 'ovh' {
  interface OvhClient {
    requestPromised(method: string, path: string, body?: Record<string, unknown>): Promise<unknown>;
  }

  interface OvhParams {
    endpoint: string;
    appKey: string;
    appSecret: string;
    consumerKey: string;
  }

  function ovh(params: OvhParams): OvhClient;
  export default ovh;
}
