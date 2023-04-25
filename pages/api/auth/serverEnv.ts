import { fromHex, KVStorage } from '../../../libs/store'

function FromHex(input: string): number[] {
  return Array.from(fromHex(input));
}

const  serverEnv =  {
    KV : new KVStorage(),  
   "oprf_seed" : FromHex("5c4f99877d253be5817b4b03f37b6da680b0d5671d1ec5351fa61c5d82eab28b9de4c4e170f27e433ba377c71c49aa62ad26391ee1cac17011d8a7e9406657c8"), 
   "server_ake_keypair" : {
     "private_key": FromHex("87ef09986545b295e8f5bbbaa7ad3dce15eb299eb2a5b34875ff421b1d63d7a3"),
     "public_key":  FromHex("025b95a6add1f2f3d038811b5ad3494bed73b1e2500d8dadec592d88406e25c2f2")
   },

   "server_identity" : "PWA OPAQUE demo",

   "PERMANENT" :false
 }

 export default serverEnv;
