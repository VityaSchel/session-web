import https from 'https'
// eslint-disable-next-line import/no-named-default
import { clone } from 'lodash'
import pRetry from 'p-retry'
import { HTTPError, NotFoundError } from './utils/errors'
import { Snode } from './snodes'
import { SnodeResponse } from './batch-request'

export const ERROR_421_HANDLED_RETRY_REQUEST = '421 handled. Retry this request with a new targetNode'

export interface LokiFetchOptions {
  method: 'GET' | 'POST';
  body: string | null;
  agent: https.Agent | null;
  headers: Record<string, string>;
}

/**
 * A small wrapper around node-fetch which deserializes response
 * returns insecureNodeFetch response or false
 */
async function doRequest({
  options,
  url,
  timeout,
}: {
  url: string;
  options: LokiFetchOptions;
  targetNode?: Snode;
  associatedWith: string | null;
  timeout: number;
}): Promise<undefined | SnodeResponse> {
  const method = options.method || 'GET'

  const fetchOptions = {
    ...options,
    timeout,
    method,
  }

  try {
    // if (url.match(/https:\/\//)) {
    //   fetchOptions.agent = snodeHttpsAgent
    // }

    fetchOptions.headers = {
      'User-Agent': 'WhatsApp',
      'Accept-Language': 'en-us',
      'Content-Type': 'application/json',
    }
    const response = await fetch(url, {
      ...fetchOptions,
      body: fetchOptions.body || undefined,
      // agent: fetchOptions.agent || undefined,
      tls: {
        rejectUnauthorized: false,
      }
    })
    if (!response.ok) {
      throw new HTTPError('Loki_rpc error', response)
    }
    const result = await response.text()

    return {
      body: result,
      status: response.status,
      bodyBinary: null,
    }
  } catch (e) {
    if (e.code === 'ENOTFOUND') {
      throw new NotFoundError('Failed to resolve address', e)
    }
    if (e.message === ERROR_421_HANDLED_RETRY_REQUEST) {
      throw new pRetry.AbortError(ERROR_421_HANDLED_RETRY_REQUEST)
    }
    throw e
  }
}

/**
 * This function will throw for a few reasons.
 * The loki-important ones are
 *  -> if we try to make a request to a path which fails too many times => user will need to retry himself
 *  -> if the targetNode gets too many errors => we will need to try to do this request again with another target node
 * The
 */
export async function snodeRpc(
  {
    method,
    params,
    targetNode,
    associatedWith,
    timeout = 10000,
  }: {
    method: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    params: Record<string, any> | Array<Record<string, any>>;
    targetNode: Snode;
    associatedWith: string | null;
    timeout?: number;
  } // the user pubkey this call is for. if the onion request fails, this is used to handle the error for this user swarm for instance
): Promise<undefined | SnodeResponse> {
  const url = `https://${targetNode.public_ip}:${targetNode.storage_port}/storage_rpc/v1`

  const body = {
    jsonrpc: '2.0',
    method,
    params: clone(params),
  }

  const fetchOptions: LokiFetchOptions = {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
    agent: null,
  }

  return doRequest({
    url,
    options: fetchOptions,
    targetNode,
    associatedWith,
    timeout,
  })
}
