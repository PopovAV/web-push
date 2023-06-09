import {
    AKEExportKeyPair,
    CredentialFile,
    ExpectedAuthResult,
    getOpaqueConfig,
    KE1,
    KE3,
    OpaqueID,
    OpaqueServer,
    RegistrationRecord,
    RegistrationRequest
} from '@cloudflare/opaque-ts'
import { NextApiRequest, NextApiResponse } from 'next'
import { serialize } from 'cookie'

const cfg = getOpaqueConfig(
    OpaqueID.OPAQUE_P256,
)

import { KVStorage, toHex } from './store'

type EnvS = {
    KV: KVStorage
    oprf_seed: number[],
    server_ake_keypair: AKEExportKeyPair,
    server_identity: string
    PERMANENT: boolean
}

export interface InitResp {

    message: string,
    envelope: number[]
}

export interface FinishResp {

    username: string,
    message: string
}

async function getKey(username: string): Promise<string> {
    const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(username))
    return "opake:" + Buffer.from(digest).toString('hex')
}

async function register_init(request: NextApiRequest, env: EnvS): Promise<InitResp> {
    const requestJSON = request.body || {}
    const initSerialized = requestJSON['init']
    const client_identity = requestJSON['username'].trim()
    // username is also being used for this demo as server-side credential_identifier
    const credential_identifier = client_identity
    const userid = await getKey(client_identity);
    if (await env.KV.get(userid, null)) {
        throw new Error('username already registered')
    }
    const registrationRequest = RegistrationRequest.deserialize(cfg, initSerialized)
    const server_identity = env.server_identity
    const registrationServer = new OpaqueServer(
        cfg,
        env.oprf_seed,
        env.server_ake_keypair,
        server_identity
    )
    const registrationResponse = await registrationServer.registerInit(registrationRequest, credential_identifier)
    if (registrationResponse instanceof Error) {
        throw new Error(`server failed to registerInit: ${registrationRequest}`)
    }
    return {
        message: 'username available, registration envelope enclosed',
        envelope: registrationResponse.serialize()
    }
}

async function register_finish(request: NextApiRequest, env: EnvS): Promise<FinishResp> {
    const requestJSON = await request.body
    const recordSerialized = requestJSON['record']
    const client_identity = requestJSON['username'].trim()
    // username is also being used for this demo as server-side credential_identifier
    const credential_identifier = client_identity
    const record = RegistrationRecord.deserialize(cfg, recordSerialized)
    const credential_file = new CredentialFile(credential_identifier, record, client_identity)
    // store in DB
    const userid = await getKey(client_identity);

    let result
    if (env.PERMANENT) {
        result = await env.KV.put(userid, credential_file.serialize(), null)
    }
    else {
        result = await env.KV.put(userid, credential_file.serialize(), { expirationTtl: 3600 })
    }
    let retrieve = await env.KV.get(userid, null)

    return { username: client_identity, message: "'" + client_identity + "' registered" }
}

export interface AuthInitResp {

    message: string,
    ke2: number[]
}

async function auth_init(request: any, env: EnvS, response: NextApiResponse): Promise<AuthInitResp> {
    const requestJSON = await request.body
    const initSerialized = requestJSON['ke1']
    const client_identity = requestJSON['username'].trim()
    // username is also being used for this demo as server-side credential_identifier  
    const credential_identifier = client_identity
    const userid = await getKey(client_identity);
    const credentials_u8array = await env.KV.get(userid, { type: 'arrayBuffer' })
    if (credentials_u8array === null) {
        throw new Error('client not found in database')
    }
    const credential_file = CredentialFile.deserialize(cfg, credentials_u8array)
    if (credential_file.credential_identifier !== credential_identifier) {
        throw new Error('credential identifier does not match key it was retrieved from')
    }
    if (credential_file.client_identity !== client_identity) {
        throw new Error('stored credentials file does not seem to match client')
    }
    const server_identity = env.server_identity

    const server = new OpaqueServer(
        cfg,
        env.oprf_seed,
        env.server_ake_keypair,
        server_identity
    )

    const ke1 = KE1.deserialize(cfg, initSerialized)

    const initiated = await server.authInit(
        ke1,
        credential_file.record,
        credential_file.credential_identifier,
        credential_file.client_identity
    )
    if (initiated instanceof Error) {
        throw initiated
    }
    const { ke2, expected } = initiated

    const session = expected.serialize();

    const prevSession = await env.KV.get(userid + "-ss", null)
    let error = 0
    if (prevSession != null) {
        error = prevSession.error + 1

        if (error > 1) {
            await env.KV.del(userid + "-ss");
            await env.KV.del(userid);
            throw new Error("Credential removed by error count 2")
        }
    }

    await env.KV.put(userid + "-ss", { session, error }, null)

    return { message: 'intermediate authentication key enclosed', ke2: ke2.serialize() }
}


export interface AuthFinish {

    message: string,
    ke2: number[]
}


export interface AuthFinishResp {
    message: string
    session_key_server: string,
    username: string
}

async function auth_finish(request: NextApiRequest, env: EnvS, response: NextApiResponse): Promise<AuthFinishResp> {
    const requestJSON = request.body
    const ke3Serialized = requestJSON['ke3']
    const client_identity = requestJSON['username'].trim()
    // username is also being used for this demo as server-side credential_identifier
    const userid = await getKey(client_identity);

    const credentials_u8array = await env.KV.get(userid, { type: 'arrayBuffer' })
    if (credentials_u8array === null) {
        throw new Error('client not found in database, but in an actual implementation there would be no need to respond with that information.')
    }
    const server_identity = env.server_identity
    const server = new OpaqueServer(
        cfg,
        env.oprf_seed,
        env.server_ake_keypair,
        server_identity
    )
    const ke3 = KE3.deserialize(cfg, ke3Serialized)
    const expectedJSON = await env.KV.get(userid + "-ss", null)
    if (!expectedJSON) {
        throw new Error('auth_init expected values not found for this client')
    }
    const expected = ExpectedAuthResult.deserialize(cfg, expectedJSON.session)

    const authFinish = server.authFinish(ke3, expected)
    if (authFinish instanceof Error) {
        throw authFinish
    }

    await env.KV.del(userid + "-ss")

    const { session_key: session_key_server } = authFinish

    return {
        message: 'login success',
        session_key_server: toHex(Buffer.from(session_key_server)),
        username: client_identity
    }
}

export { register_init, register_finish, auth_init, auth_finish }