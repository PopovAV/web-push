import NextAuth, { NextAuthOptions } from "next-auth"
import YandexProvider from "next-auth/providers/yandex";
import GoogleProvider from "next-auth/providers/google"

// For more information on each option (and a full list of options) go to
// https://next-auth.js.org/configuration/options
export const authOptions: NextAuthOptions = {
  // https://next-auth.js.org/configuration/providers/oauth
  providers:[
    YandexProvider({
      clientId: process.env.YANDEX_CLIENT_ID??"",
      clientSecret: process.env.YANDEX_CLIENT_SECRET??""
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID??"",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET??""
    }),
  ],
  callbacks: {
    async jwt({ token }) {
      token.userRole = "admin"
      return token
    },
  },
  secret: process.env.NEXTAUTH_SECRET,

}

export default NextAuth(authOptions)

