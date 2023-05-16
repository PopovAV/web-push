import { Redis, RedisConfigNodejs } from '@upstash/redis'


export class KVStorage {

    redis: Redis

    constructor() {
        let config: RedisConfigNodejs = {
            url: process.env.UPSTASH_REDIS_REST_URL ?? "",
            token: process.env.UPSTASH_REDIS_REST_TOKEN ?? ""
        }
        this.redis = new Redis(config);
    }

    async get(k: string, prop: any | null): Promise<any | null> {
        let v = await this.redis.get(k);
        if (v == null) return null;
        return v;

    }

    async put(k: string, v: any, ttl: any | null = null): Promise<boolean> {
        let res = await this.redis.set(k, v, ttl)
        return res == "OK"
    }

    async del(k: string): Promise<boolean> {
        let res = await this.redis.del(k)
        return res > 1
    }
}

export function fromHexString(x: string): string {
    return Buffer.from(x, 'hex').toString()
}

export function toHexString(x: ArrayBuffer): string {
    return Buffer.from(x).toString('hex');
}

export function fromHex(x: string): Uint8Array {
    return Uint8Array.from(Buffer.from(x, 'hex'))
}

export function toHex(x: Uint8Array): string {
    return Buffer.from(x).toString('hex')
}

export function toHexFromNumbers(x: number[]): string {
    return Buffer.from(x).toString('hex')
}
export function tob64FromNumbers(x: number[]): string {
    return Buffer.from(x).toString('base64')
}


export function notNullHexString(x: unknown): string {
    return typeof x === 'string' ? fromHexString(x) : ''
}

export function notNullHex(x: unknown): Uint8Array {
    return typeof x === 'string' ? fromHex(x) : new Uint8Array(0)
}

export function tob64(x: Uint8Array): string {
    return Buffer.from(x).toString("base64")
}

export function fromb64(x: string): Uint8Array {
    return Uint8Array.from(Buffer.from(x, 'base64'));
}

export function fromb64url(value: string) {

    value = value.replaceAll('-', '+').replaceAll('_', '/'); // 62nd char of encoding

    switch (value.length % 4) // Pad with trailing '='s
    {
        case 0: break; // No pad chars in this case
        case 2: value += "=="; break; // Two pad chars
        case 3: value += "="; break; // One pad char
    }
    return value;

}