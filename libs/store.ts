import { Redis } from '@upstash/redis'


export class KVStorage {
   
    redis: Redis

    constructor() {
        this.redis = new Redis({ 
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN
        })
    }
   
    async get (k:string, prop:any| null) : Promise<any|null>{
       let v = await this.redis.get(k);
       if(v==null) return null;
       return v;
       
    }

    async put (k: string, v: any, ttl :any | null) : Promise<boolean>{
        let res = await this.redis.set(k,v, ttl)
        return res =="OK"
    }

    async del (k: string) : Promise<boolean>{
        let res = await this.redis.del(k)
        return res >1
    }
}

export function fromHexString(x: string): string {
    return Buffer.from(x, 'hex').toString()
}

export function fromHex(x: string): Uint8Array {
    return Uint8Array.from(Buffer.from(x, 'hex'))
}

export function toHex(x: Uint8Array): string {
    return Buffer.from(x).toString('hex')
}

export function notNullHexString(x: unknown): string {
    return typeof x === 'string' ? fromHexString(x) : ''
}

export function notNullHex(x: unknown): Uint8Array {
    return typeof x === 'string' ? fromHex(x) : new Uint8Array(0)
}