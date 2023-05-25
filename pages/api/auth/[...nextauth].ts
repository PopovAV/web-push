import NextAuth, { NextAuthOptions, RequestInternal } from "next-auth"
import YandexProvider from "next-auth/providers/yandex";
import GoogleProvider from "next-auth/providers/google"
import { getUserId } from "../../../libs/webauthn";
import { NextApiRequest, NextApiResponse } from "next";
import { SaveOrUpdateDevice } from "../../../libs/deviceStore";
import { PushAll } from "../../../libs/webpush";


let request: NextApiRequest;
export default async function auth(req: NextApiRequest, res: NextApiResponse) {
  request = req;
  return await NextAuth(req, res, authOptions)
}




export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/oauth
  providers: [
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID ?? "",
      clientSecret: process.env.YANDEX_CLIENT_SECRET ?? ""
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ""
    }),
  ],
  callbacks: {
    async jwt({ token }) {

      const login = token.email ?? "";

      if (!token.deviceid && request && request.headers) {

        const deviceId = request.headers["x-finger-print"] as string;
        const userAgent = request.headers["user-agent"] as string;
       

        if (deviceId) {
          try {
            const crypto = await import('node:crypto');
            globalThis.crypto = crypto.webcrypto;
          } catch (err) {
            console.error('crypto support is disabled!');
          }
          const userid = await getUserId(login)
          token.deviceid = deviceId;
          const { devices, isNew } = await SaveOrUpdateDevice(userid, { id: deviceId, useragent: userAgent });
          await PushAll(login, `attention, you are logged in on another device ${deviceId} : ${userAgent}`, [deviceId])
        }
      }

      return token


    },
    async signIn(opts) {

      const isAllowedToSignIn = true
      if (isAllowedToSignIn) {
        return true
      } else {
        // Return false to display a default error message
        return false
        // Or you can return a URL to redirect to:
        // return '/unauthorized'
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,

}


