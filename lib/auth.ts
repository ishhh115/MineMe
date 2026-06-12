import type { NextAuthOptions } from "next-auth"
//import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"

export const authOptions: NextAuthOptions = {
  providers: [
    /*GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }), */
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "WhatsApp Number", type: "tel" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any) {
        const normalize = (value?: string | null) => {
          const trimmed = (value || "").trim()
          return trimmed && trimmed !== "undefined" ? trimmed : ""
        }

        const identifier =
          normalize(credentials?.phone) || normalize(credentials?.email)

        if (!identifier || !credentials?.password) return null

        try {
          const user = await sanityClient.fetch(
            `*[_type == "user" && (phone == $identifier || email == $identifier)][0]`,
            { identifier }
          )

          if (!user) return null

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          if (!isValid) return null

          console.log("LOGIN USER:", {
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  organisationId: user.organisation?._ref,
  role: user.role,
})

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            organisationId: user.organisation?._ref,
            role: user.role,
            isVerified: user.isVerified,
          }
        } catch {
          return null
        }
      },
    }),
  ],

  pages: {
    signIn: "/login",
    newUser: "/onboarding",
  },

  callbacks: {
    async signIn({ user, account }: any) {
     /* if (account?.provider === "google") {
        try {
          const existing = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: user.email }
          )

          if (!existing) {
            const orgSlug = user.email
              ?.split("@")[0]
              .toLowerCase()
              .replace(/[^a-z0-9]/g, "-")

            const newOrg = await sanityClient.create({
              _type: "organisation",
              name: `${user.name}'s Organisation`,
              slug: {
                _type: "slug",
                current: `${orgSlug}-${Date.now()}`,
              },
              plan: "free",
              responseRate: 0,
              totalMessagesSent: 0,
              totalRemindersDelivered: 0,
              notificationPreferences: {
                whatsapp: true,
                email: false,
                urgentOnly: false,
              },
              createdAt: new Date().toISOString(),
            })

            await sanityClient.create({
              _type: "user",
              name: user.name,
              email: user.email,
              phone: "",
              organisation: {
                _type: "reference",
                _ref: newOrg._id,
              },
              role: "admin",
              isVerified: true,
              createdAt: new Date().toISOString(),
            })
          }
        } catch {
          return false
        }
      }
      */

      return true
    },

    async jwt({ token, user, account }: any) {
      if (user) {
        token.phone = user.phone
        token.organisationId = user.organisationId
        token.role = user.role
        token.id = user.id
      }
/*
      if (account?.provider === "google") {
        const sanityUser = await sanityClient.fetch(
          `*[_type == "user" && email == $email][0]`,
          { email: token.email }
        )

        if (sanityUser) {
          token.organisationId = sanityUser.organisation?._ref
          token.role = sanityUser.role
          token.id = sanityUser._id
          token.isVerified = sanityUser.isVerified
        }
      }
*/
      return token
    },

    async session({ session, token }: any) {
      if (session.user) {
        session.user.phone = token.phone
        session.user.organisationId = token.organisationId
        session.user.role = token.role
        session.user.id = token.id
        session.user.isVerified = token.isVerified
      }

      return session
    },
  },

  session: {
    strategy: "jwt",
  },

  secret: process.env.NEXTAUTH_SECRET,
}