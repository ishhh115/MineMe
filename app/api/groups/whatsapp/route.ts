import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getWhatsappGroups } from "@/lib/whapi"
import { sanityClient } from "@/lib/sanity"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const orgId = (session?.user as { organisationId?: string })?.organisationId
    const adminPhone = (session?.user as { phone?: string })?.phone

    if (!orgId) {
      return NextResponse.json(
        { error: "No organisation found" },
        { status: 401 }
      )
    }

    if (!adminPhone) {
      return NextResponse.json(
        { error: "No admin phone found" },
        { status: 401 }
      )
    }

    // Normalize admin phone — strip everything except digits
    const normalizedAdminPhone = adminPhone.replace(/\D/g, "")

    // Fetch all groups from Whapi
    const data = await getWhatsappGroups()
    const whapiGroups = data.groups || []

    if (whapiGroups.length === 0) {
      return NextResponse.json({ groups: [] })
    }

    // Get all chatIds from Whapi
    const chatIds = whapiGroups.map((g: any) => g.id)

    // Find which of these are already claimed in Sanity
    const claimedGroups = await sanityClient.fetch(
      `*[_type == "group" && chatId in $chatIds]{
        chatId,
        "organisationId": organisation._ref
      }`,
      { chatIds }
    )

    // Build map: chatId → organisationId
    const claimedMap: Record<string, string> = {}
    claimedGroups.forEach((g: { chatId: string; organisationId: string }) => {
      if (g.organisationId) {
        claimedMap[g.chatId] = g.organisationId
      }
    })

    // Filter groups:
    // 1. Admin phone must exist in participants
    // 2. Group must be unclaimed OR claimed by current org
    const availableGroups = whapiGroups.filter((g: any) => {
      // Check ownership first
      const owner = claimedMap[g.id]
      const ownershipOk = !owner || owner === orgId

      if (!ownershipOk) return false

      // Check if admin phone is in participants
      const participants: any[] = g.participants || []
      const adminIsPresent = participants.some((p: any) => {
        const participantPhone = (p.id || "").replace(/\D/g, "")
        return participantPhone.endsWith(normalizedAdminPhone) ||
               normalizedAdminPhone.endsWith(participantPhone)
      })

      return adminIsPresent
    })

    console.log(`Admin phone: ${normalizedAdminPhone}`)
    console.log(`Total Whapi groups: ${whapiGroups.length}`)
    console.log(`Available for this org: ${availableGroups.length}`)

    return NextResponse.json({ groups: availableGroups })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Failed to fetch WhatsApp groups" },
      { status: 500 }
    )
  }
}