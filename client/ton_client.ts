import { TonClient } from '@ton/ton';

export const TESTNET_RPC = 'https://testnet.toncenter.com/api/v2/jsonRPC';

/**
 * Creates a rate-limited and auto-retrying TonClient instance.
 * Ensures strict adherence to TON Center free-tier rate limits (1 req/sec)
 * and automatically backs off on HTTP 429 errors.
 */
export function createThrottledTonClient(endpoint: string = TESTNET_RPC): TonClient {
    const client = new TonClient({ endpoint });
    const api = (client as any).api;
    const originalDoCall = api.doCall.bind(api);
    let lastCallTime = 0;
    let callQueue: Promise<any> = Promise.resolve();

    api.doCall = async function (method: string, body: any, codec: any) {
        return new Promise((resolve, reject) => {
            callQueue = callQueue.then(async () => {
                let attempts = 0;
                while (attempts < 7) {
                    const now = Date.now();
                    const elapsed = now - lastCallTime;
                    if (elapsed < 1400) {
                        await new Promise((r) => setTimeout(r, 1400 - elapsed));
                    }
                    lastCallTime = Date.now();

                    try {
                        const result = await originalDoCall(method, body, codec);
                        resolve(result);
                        return;
                    } catch (err: any) {
                        attempts++;
                        const is429 =
                            (err?.message && err.message.includes('429')) ||
                            (err?.response && err.response.status === 429);

                        if (is429) {
                            console.log(`⏳ Rate limit hit. Backing off for 4s (attempt ${attempts}/7)...`);
                            await new Promise((r) => setTimeout(r, 4000));
                        } else if (attempts >= 7) {
                            reject(err);
                            return;
                        } else {
                            console.log(`⚠️ RPC network error: ${err.message}. Retrying in 2.5s...`);
                            await new Promise((r) => setTimeout(r, 2500));
                        }
                    }
                }
            }).catch(reject);
        });
    };

    return client;
}
