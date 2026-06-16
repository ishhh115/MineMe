import { NextResponse } from "next/server"
import { getWhatsappGroups } from "@/lib/whapi"

export async function GET() {
  try {
    const groups = await getWhatsappGroups()

    return NextResponse.json(groups)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Failed to fetch WhatsApp groups" },
      { status: 500 }
    )
  }
}