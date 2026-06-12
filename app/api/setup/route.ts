import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"

export async function POST(request: Request) {
  try {
    const { name, botPhoneNumber } = await request.json()

    // Check if organisation already exists
    const existing = await sanityClient.fetch(
      `*[_type == "organisation"][0]`
    )

    if (existing) {
      return NextResponse.json({
        message: "Organisation already exists",
        organisationId: existing._id,
        organisation: existing,
      })
    }

    // Create organisation
    const organisation = await sanityClient.create({
      _type: "organisation",
      name: name || "MindMe",
      slug: {
        _type: "slug",
        current: (name || "whatsapp-bot").toLowerCase().replace(/\s+/g, "-"),
      },
      botPhoneNumber: botPhoneNumber || "",
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

    return NextResponse.json({
      message: "Organisation created successfully",
      organisationId: organisation._id,
      organisation,
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ message: "Setup failed" }, { status: 500 })
  }
}

// Get organisation details
export async function GET() {
  try {
    const organisation = await sanityClient.fetch(
      `*[_type == "organisation"][0]`
    )

    if (!organisation) {
      return NextResponse.json({ message: "No organisation found" }, { status: 404 })
    }

    return NextResponse.json({
      organisationId: organisation._id,
      organisation,
    })
  } catch (error) {
    console.error("Get organisation error:", error)
    return NextResponse.json({ message: "Failed to get organisation" }, { status: 500 })
  }
}