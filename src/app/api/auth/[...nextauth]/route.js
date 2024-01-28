import GoogleProvider from 'next-auth/providers/google'
import NextAuth from "next-auth/next"

const options = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
            clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET
        })
    ],
}

const handler = NextAuth(options)

export { handler as GET, handler as POST }