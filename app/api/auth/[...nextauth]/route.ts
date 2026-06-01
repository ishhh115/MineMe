import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { sanityClient } from "@/lib/sanity"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        phone: { label: "WhatsApp Number", type: "tel" },
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const normalize = (value?: string | null) => {
          const trimmed = (value || "").trim()
          return trimmed && trimmed !== "undefined" ? trimmed : ""
        }

        const identifier = normalize(credentials?.phone) || normalize(credentials?.email)
        console.log("Login attempt:", { identifier, hasPassword: !!credentials?.password })

        if (!identifier || !credentials?.password) return null

        try {
          const user = await sanityClient.fetch(
            `*[_type == "user" && (phone == $identifier || email == $identifier)][0]`,
            { identifier }
          )

          console.log("User found:", {
            exists: !!user,
            isVerified: user?.isVerified,
            hasPassword: !!user?.password,
          })

          if (!user) return null

          if (!user.isVerified) {
            console.log("User not verified — allowing for local testing")
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password
          )

          console.log("Password valid:", isValid)

          if (!isValid) return null

          return {
            id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            organisationId: user.organisation?._ref,
            role: user.role,
            isVerified: user.isVerified,
          }
        } catch (error) {
          console.error("Auth error:", error)
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
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          const existing = await sanityClient.fetch(
            `*[_type == "user" && email == $email][0]`,
            { email: user.email }
          )

          if (!existing) {
            const orgSlug = user.email!
              .split("@")[0]
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
              organisation: { _type: "reference", _ref: newOrg._id },
              role: "admin",
              isVerified: true,
              createdAt: new Date().toISOString(),
            })
          }
        } catch (error) {
          console.error("Google sign in error:", error)
          return false
        }
      }
      return true
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.phone = (user as any).phone
        token.organisationId = (user as any).organisationId
        token.role = (user as any).role
        token.id = user.id
      }
      if (account?.provider === "google") {
        try {
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
        } catch (error) {
          console.error("JWT callback error:", error)
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).phone = token.phone
        ;(session.user as any).organisationId = token.organisationId
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
        ;(session.user as any).isVerified = token.isVerified
      }
      return session
    },
  },
  session: {
    strategy: "jwt" as const,
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }