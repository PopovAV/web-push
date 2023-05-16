import { CryptoKey } from '@simplewebauthn/typescript-types';




export async function aes_encrypt(key: CryptoKey, IV: string, data: string): Promise<string> {
    const crypto = window.crypto;
    const buffer =  await crypto.subtle.encrypt({
        name: "AES-GCM",
        iv: sta(IV),
        tagLength: 128, //can be 32, 64, 96, 104, 112, 120 or 128 (default)
    },
        key, //from generateKey or importKey above
        sta(data) //ArrayBuffer of data you want to encrypt
    )
    console.log(buffer);

    return Buffer.from(buffer).toString('hex');
}

export async function aes_decrypt(key: CryptoKey, IV: string, encText: string): Promise<string> {
    const crypto = window.crypto;
    const encBuffer = Buffer.from(encText,"hex");
    console.log(encBuffer);
    const buffer = await crypto.subtle.decrypt({
        name: "AES-GCM",
        iv: sta(IV), //The initialization vector you used to encrypt
        tagLength: 128 //The tagLength you used to encrypt (if any)
    },
        key, //from generateKey or importKey above
        encBuffer //ArrayBuffer of the data
    )
    return ats(buffer)
}



export async function ecdh_generate_keypair(curve:string = "P-256"): Promise<CryptoKeyPair> {
    const crypto = window.crypto;
    return await crypto.subtle.generateKey({
        name: "ECDH",
        namedCurve: curve //can be "P-256", "P-384", or "P-521"
    },
        false, //whether the key is extractable (i.e. can be used in exportKey)
        ["deriveKey"] //can be any combination of "deriveKey" and "deriveBits"
    );
}

export async function ecdh_export(key: CryptoKey): Promise<JsonWebKey> {
    const crypto = window.crypto;
    return await crypto.subtle.exportKey(
        "jwk", //can be "jwk" (public or private), "raw" (public only), "spki" (public only), or "pkcs8" (private only)
        key //can be a publicKey or privateKey, as long as extractable was true
    )

}

export async function ecdh_import(key: JsonWebKey, curve:string ="P-256"): Promise<CryptoKey> {
    const crypto = window.crypto;
    return await crypto.subtle.importKey(
        "jwk", //can be "jwk" (public or private), "raw" (public only), "spki" (public only), or "pkcs8" (private only)
        key, { //these are the algorithm options
        name: "ECDH",
        namedCurve: curve, //can be "P-256", "P-384", or "P-521"
    },
        true, //whether the key is extractable (i.e. can be used in exportKey)
        [] //"deriveKey" and/or "deriveBits" for private keys only (just put an empty list if importing a public key)
    );
}

export async function ecdh_derive_key(pub: CryptoKey, priv: CryptoKey): Promise<CryptoKey> {
    const crypto = window.crypto;
    return await crypto.subtle.deriveKey({
        name: "ECDH",
        public: pub, //an ECDH public key from generateKey or importKey
    },
        priv, //your ECDH private key from generateKey or importKey
        { //the key type you want to create based on the derived bits
            name: "AES-GCM", //can be any AES algorithm ("AES-CTR", "AES-GCM", "AES-CMAC", "AES-GCM", "AES-CFB", "AES-KW", "ECDH", "DH", or "HMAC")
            //the generateKey parameters for that type of algorithm
            length: 256, //can be  128, 192, or 256
        },
        false, //whether the derived key is extractable (i.e. can be used in exportKey)
        ["encrypt", "decrypt"] //limited to the options in that algorithm's importKey
    );

}

// string-to-arraybuffer
function sta(data: string): ArrayBuffer {
    const enc = new TextEncoder();
    return enc.encode(data);
}

// arraybuffer-to-string
function ats(data: ArrayBuffer): string {
    const enc = new TextDecoder();
    return enc.decode(data);
}

// JSON into and out of the database for cryptokeys
function json_compress(obj: any) {
    let s = JSON.stringify(obj);
    s = s.replace(/,/g, "♀");
    s = s.replace(/{/g, "☺");
    s = s.replace(/}/g, "☻");
    return s;
}

function json_decompress(str: string) {
    str = str.replace(/♀/g, ",");
    str = str.replace(/☺/g, "{");
    str = str.replace(/☻/g, "}");
    return JSON.parse(str);
}
