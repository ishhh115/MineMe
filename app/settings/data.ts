import { getServerSession } from "next-auth"
import { getGroups } from "@/lib/queries"
import { sanityClient } from "@/lib/sanity"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

type SettingsOrganisation = {
  _id: string
  name?: string
  whapiToken?: string
  botPhoneNumber?: string
  webhookUrl?: string
  notificationPreferences?: {
    whatsapp?: boolean
    email?: boolean
    urgentOnly?: boolean
  }
}

export async function getSettingsPageData() {
  try {
    const session = await getServerSession(authOptions)
    const orgId =
      (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      throw new Error("No organisation ID found")
    }

    const organisation = await sanityClient.fetch<SettingsOrganisation>(
      `*[_type == "organisation" && _id == $orgId][0]{
        _id,
        name,
        whapiToken,
        botPhoneNumber,
        webhookUrl,
        notificationPreferences
      }`,
      { orgId }
    )

    if (!organisation) {
      throw new Error("Organisation not found")
    }

    const groups = await getGroups(orgId)

    return {
      organisation: {
        ...organisation,
        webhookUrl:
          organisation.webhookUrl ||
          `${process.env.NEXTAUTH_URL || ""}/api/webhook`,
      },
      groups,
    }
  } catch (error) {
    console.error("Settings data fetch error:", error)
    return {
      organisation: {
        _id: "",
        name: "",
        whapiToken: "",
        botPhoneNumber: "",
        webhookUrl: `${process.env.NEXTAUTH_URL || ""}/api/webhook`,
        notificationPreferences: {
          whatsapp: true,
          email: false,
          urgentOnly: false,
        },
      },
      groups: [],
    }
  }
}