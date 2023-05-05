
import { CredentialDeviceType, 
  PublicKeyCredentialCreationOptionsJSON,
   PublicKeyCredentialRequestOptionsJSON } from '@simplewebauthn/typescript-types';
import {
  VerifiedRegistrationResponse,
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';

import { KVStorage, fromb64, tob64 } from './store'

const store = new KVStorage();

type UserModel = {
  id: string;
  username: string;
  currentChallenge?: string;
};

/**
 * It is strongly advised that authenticators get their own DB
 * table, ideally with a foreign key to a specific UserModel.
 *
 * "SQL" tags below are suggestions for column data types and
 * how best to store data received during registration for use
 * in subsequent authentications.
 */
type Authenticator = {
  // SQL: Encode to base64url then store as `TEXT`. Index this column
  credentialID: string;
  // SQL: Store raw bytes as `BYTEA`/`BLOB`/etc...
  credentialPublicKey: string;
  // SQL: Consider `BIGINT` since some authenticators return atomic timestamps as counters
  counter: number;
  // SQL: `VARCHAR(32)` or similar, longest possible value is currently 12 characters
  // Ex: 'singleDevice' | 'multiDevice'
  credentialDeviceType: CredentialDeviceType;
  // SQL: `BOOL` or whatever similar type is supported
  credentialBackedUp: boolean;
  // SQL: `VARCHAR(255)` and store string array as a CSV string
  // Ex: ['usb' | 'ble' | 'nfc' | 'internal']
  transports?: AuthenticatorTransport[];
};


// Human-readable title for your website
const rpName = 'SimpleWebAuthn';
// A unique identifier for your website
const rpID = `${process.env.HOST_NAME}`;
// The URL at which registrations and authentications should occur
const origin = `https://${rpID}${process.env.CUSTOM_PORT??""}`;

async function getUserFromDB(loggedInUserId: string): Promise<UserModel> {
  return await store.get("wan-auth-user:" + loggedInUserId, null)
}

async function SaveUserToDB(user: UserModel): Promise<void> {
  await store.put("wan-auth-user:" + user.id, user, null)
}

async function setUserCurrentChallenge(user: UserModel, challenge: string): Promise<void> {
  user.currentChallenge = challenge;
  await SaveUserToDB(user)
}


async function getUserAuthenticators(user: UserModel): Promise<Authenticator[]> {
  return (await store.get("wan-auth-as:" + user.id, null)) as Authenticator[];
}

function fromb64url(value : string){

  value = value.replaceAll('-', '+').replaceAll('_', '/'); // 62nd char of encoding
  
  switch (value.length % 4) // Pad with trailing '='s
  {
      case 0: break; // No pad chars in this case
      case 2: value += "=="; break; // Two pad chars
      case 3: value += "="; break; // One pad char
  }
  return value;

}

async function getUserAuthenticator(user: UserModel, authentificatorId: string): Promise<Authenticator | undefined> {
  let auths: Authenticator[] = await store.get("wan-auth-as:" + user.id, null);
  let b64 =  fromb64url(authentificatorId)
  return auths.find((a) => a.credentialID == b64)
}

async function saveNewUserAuthenticatorInDB(user: UserModel, newAuthenticator: Authenticator) {
  const auths = await getUserAuthenticators(user)?? []
  auths.push(newAuthenticator)
  await store.put("wan-auth-as:" + user.id, auths, null);
}

async function getUserId(username: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(username))
  return Buffer.from(digest).toString('hex')
}


export async function get_reg_options(username: string): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const userId = await getUserId(username)

  let user: UserModel = await getUserFromDB(userId);

  if (user == null) {
    user = {
      id: userId,
      username
    }
  }

  const userAuthenticators: Authenticator[] = await getUserAuthenticators(user)??[]

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID: user.id,
    userName: user.username,
    // Don't prompt users for additional information about the authenticator
    // (Recommended for smoother UX)
    attestationType: 'none',
    // Prevent users from re-registering existing authenticators
    excludeCredentials: userAuthenticators.map(authenticator => ({
      id: fromb64(authenticator.credentialID),
      type: 'public-key',
      // Optional
      transports: authenticator.transports,
    })),
  });

  await setUserCurrentChallenge(user, options.challenge);

  return options;
}

export async function verify_reg(username :string, body : any): Promise<VerifiedRegistrationResponse> {

  const userId = await getUserId(username)

  const user: UserModel = await getUserFromDB(userId);

  const expectedChallenge: string = user.currentChallenge ?? "";

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });
  } catch (error) {
    console.error(error);
    throw error;
  }

  if (verification.verified) {

    const { registrationInfo } = verification;

    const newAuthenticator: Authenticator = {
      credentialID: tob64(registrationInfo?.credentialID ?? new Uint8Array()),
      credentialPublicKey:  tob64(registrationInfo?.credentialPublicKey ?? new Uint8Array()),
      counter: registrationInfo?.counter ?? 0,
      credentialDeviceType:registrationInfo?.credentialDeviceType??'singleDevice',
      credentialBackedUp: false
    };

    await saveNewUserAuthenticatorInDB(user, newAuthenticator)

  }

  return verification;
}


export async function get_auth_options(username: string): Promise<PublicKeyCredentialRequestOptionsJSON> {

  const userId = await getUserId(username)

  let user: UserModel = await getUserFromDB(userId);
 
  if(user ==null) throw new Error(`user ${username} was not fount`)

  const userAuthenticators: Authenticator[] = await getUserAuthenticators(user)??[];

  const options = generateAuthenticationOptions({
    // Require users to use a previously-registered authenticator
    allowCredentials: userAuthenticators.map(authenticator => ({
      id: fromb64(authenticator.credentialID),
      type: 'public-key',
      // Optional
      transports: authenticator.transports,
    })),
    userVerification: 'preferred',
  });

  setUserCurrentChallenge(user, options.challenge);

  return options;
}

export async function verify_auth(username :string, body : any): Promise<VerifiedRegistrationResponse> {

  const userId = await getUserId(username)

  let user: UserModel = await getUserFromDB(userId);

  const expectedChallenge: string = user.currentChallenge ?? "";

  const authenticator = await getUserAuthenticator(user, body.id);

  if (!authenticator) {
    throw new Error(`Could not find authenticator ${body.id} for user ${user.id}`);
  }

  const  devAuth = {
    credentialID: fromb64(authenticator.credentialID),
    credentialPublicKey: fromb64(authenticator.credentialPublicKey),
    counter: authenticator.counter,
    credentialDeviceType: authenticator.credentialDeviceType,
    credentialBackedUp: authenticator.credentialBackedUp,
    transports: authenticator.transports,
    
  }

  let verification;

  verification = await verifyAuthenticationResponse({
    response: body,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: devAuth,
  });


  return verification

}