import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { sanityClient } from "@/lib/sanity"
import { authOptions } from "@/lib/auth"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const orgId =
      (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      return NextResponse.json({ message: "No organisation ID found" }, { status: 400 })
    }

    const organisation = await sanityClient.fetch(
      `*[_type == "organisation" && _id == $orgId][0]`,
      { orgId }
    )

    if (!organisation) {
      return NextResponse.json({ message: "Organisation not found" }, { status: 404 })
    }

    return NextResponse.json({ organisation })
  } catch (error) {
    console.error("settings GET error", error)
    return NextResponse.json({ message: "Failed to load settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    const orgId =
      (session?.user as { organisationId?: string } | undefined)?.organisationId

    if (!orgId) {
      return NextResponse.json({ message: "No organisation ID found" }, { status: 400 })
    }

    const body = await request.json()
    const { whapiToken, botPhoneNumber, webhookUrl, notificationPreferences, groups } = body as {
      whapiToken?: string
      botPhoneNumber?: string
      webhookUrl?: string
      notificationPreferences?: {
        whatsapp?: boolean
        email?: boolean
        urgentOnly?: boolean
      }
      groups?: Array<{ _id: string; isMonitoring: boolean }>
    }

    const existingOrganisation = await sanityClient.fetch(
      `*[_type == "organisation" && _id == $orgId][0]{ notificationPreferences }`,
      { orgId }
    )

    const previousPreferences = existingOrganisation?.notificationPreferences || {}

    const organisationPatch = await sanityClient
      .patch(orgId)
      .set({
        whapiToken: whapiToken ?? "",
        botPhoneNumber: botPhoneNumber ?? "",
        webhookUrl: webhookUrl ?? "",
        notificationPreferences,
      })
      .commit()

    const cancellationJobs: Promise<unknown>[] = []
    const nextPreferences = notificationPreferences || previousPreferences

    const whatsappDisabled = previousPreferences.whatsapp && nextPreferences.whatsapp === false
    const emailDisabled = previousPreferences.email && nextPreferences.email === false

    if (whatsappDisabled) {
      cancellationJobs.push(
        sanityClient
          .fetch(`*[_type == "notification" && organisation._ref == $orgId && channel == "whatsapp" && status in ["pending", "retrying"]]{_id}`, { orgId })
          .then((notifications: Array<{ _id: string }>) =>
            Promise.all(
              notifications.map((notification) =>
                sanityClient.patch(notification._id).set({ status: "cancelled" }).commit()
              )
            )
          )
      )
    }

    if (emailDisabled) {
      cancellationJobs.push(
        sanityClient
          .fetch(`*[_type == "notification" && organisation._ref == $orgId && channel == "email" && status in ["pending", "retrying"]]{_id}`, { orgId })
          .then((notifications: Array<{ _id: string }>) =>
            Promise.all(
              notifications.map((notification) =>
                sanityClient.patch(notification._id).set({ status: "cancelled" }).commit()
              )
            )
          )
      )
    }

    await Promise.all(cancellationJobs)

    const groupResults = await Promise.all(
      (groups || []).map((group) =>
        sanityClient.patch(group._id).set({ isMonitoring: group.isMonitoring }).commit()
      )
    )

    return NextResponse.json({
      message: "Settings saved successfully",
      organisation: organisationPatch,
      groups: groupResults,
    })
  } catch (error) {
    console.error("settings PATCH error", error)
    return NextResponse.json({ message: "Failed to save settings" }, { status: 500 })
  }
}