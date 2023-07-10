/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import { getResponses } from './replay'

/* eslint  @typescript-eslint/no-empty-interface: "off" */
export interface Env {
  // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
  // MY_KV_NAMESPACE: KVNamespace;
  //
  // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
  // MY_DURABLE_OBJECT: DurableObjectNamespace;
  //
  // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
  // MY_BUCKET: R2Bucket;
  //
  // Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
  // MY_SERVICE: Fetcher;
  //
  // Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
  // MY_QUEUE: Queue;
}

export default {
  async fetch (request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade')
    if (upgradeHeader === null || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 })
    }

    const webSocketPair = new WebSocketPair()
    const [client, server] = Object.values(webSocketPair)

    server.accept()
    server.addEventListener('open', _ => { console.log('websocket open') })
    server.addEventListener('close', _ => { console.log('websocket close') })
    server.addEventListener('error', event => { console.log(event.error) })
    server.addEventListener('message', event => {
      // when receive bytes of replay file from client, parse and send `YgoProPacket` intervally.

      const replayData = event.data as ArrayBuffer
      const responses = getResponses(replayData)

      const timeoutId = setInterval(() => {
        const response = responses.shift()
        if (response == null) {
          // send response finished, close websocket
          server.close()
          clearInterval(timeoutId)
          return
        }

        server.send(response)
      }, 1000)
    })

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }
}
