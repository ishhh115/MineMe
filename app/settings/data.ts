import { getServerSession } from "next-auth"
import { sanityClient } from "@/lib/sanity"
import { authOptions } from "@/lib/auth"

export type SettingsPageData = {
  organisation: {
    _id: string
    name: string
    plan: string
    botPhoneNumber: string
    inviteCode: string
    webhookUrl: string
    notificationPreferences: {
      whatsapp: boolean
      email: boolean
      urgentOnly: boolean
    }
  }
  stats: {
    totalGroups: number
    activeGroups: number
    totalMembers: number
    adminCount: number
    managerCount: number
    memberCount: number
    guestCount: number
  }
}

export async function getSettingsPageData(): Promise<SettingsPageData> {
  const fallback: SettingsPageData = {
    organisation: {
      _id: "",
      name: "",
      plan: "free",
      botPhoneNumber: "",
      inviteCode: "",
      webhookUrl: `${process.env.NEXTAUTH_URL || ""}/api/webhook`,
      notificationPreferences: {
        whatsapp: true,
        email: false,
        urgentOnly: false,
      },
    },
    stats: {
      totalGroups: 0,
      activeGroups: 0,
      totalMembers: 0,
      adminCount: 0,
      managerCount: 0,
      memberCount: 0,
      guestCount: 0,
    },
  }

  try {
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string } | undefined)?.organisationId
    if (!orgId) return fallback

    const [organisation, groupStats, userStats] = await Promise.all([
      sanityClient.fetch(
        `*[_type == "organisation" && _id == $orgId][0]{
          _id, name, plan, botPhoneNumber, inviteCode,
          webhookUrl, notificationPreferences
        }`,
        { orgId }
      ),
      sanityClient.fetch(
        `{
          "totalGroups": count(*[_type == "group" && organisation._ref == $orgId]),
          "activeGroups": count(*[_type == "group" && organisation._ref == $orgId && isMonitoring == true])
        }`,
        { orgId }
      ),
      sanityClient.fetch(
        `{
          "totalMembers": count(*[_type == "user" && organisation._ref == $orgId]),
          "adminCount": count(*[_type == "user" && organisation._ref == $orgId && role == "admin"]),
          "managerCount": count(*[_type == "user" && organisation._ref == $orgId && role == "manager"]),
          "memberCount": count(*[_type == "user" && organisation._ref == $orgId && role == "member"]),
          "guestCount": count(*[_type == "user" && organisation._ref == $orgId && role == "guest"])
        }`,
        { orgId }
      ),
    ])

    if (!organisation) return fallback

    return {
      organisation: {
        _id: organisation._id,
        name: organisation.name || "",
        plan: organisation.plan || "free",
        botPhoneNumber: organisation.botPhoneNumber || "",
        inviteCode: organisation.inviteCode || "",
        webhookUrl: organisation.webhookUrl || `${process.env.NEXTAUTH_URL || ""}/api/webhook`,
        notificationPreferences: organisation.notificationPreferences || {
          whatsapp: true,
          email: false,
          urgentOnly: false,
        },
      },
      stats: {
        totalGroups: groupStats.totalGroups || 0,
        activeGroups: groupStats.activeGroups || 0,
        totalMembers: userStats.totalMembers || 0,
        adminCount: userStats.adminCount || 0,
        managerCount: userStats.managerCount || 0,
        memberCount: userStats.memberCount || 0,
        guestCount: userStats.guestCount || 0,
      },
    }
  } catch (error) {
    console.error("Settings data fetch error:", error)
    return fallback
  }
}