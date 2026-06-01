import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function analyzeMessage(text: string) {
  try {
    const todayDate = new Date().toISOString().split("T")[0]

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a task extraction assistant for WhatsApp group messages.
Today's date is ${todayDate}.
Analyze the message and return ONLY a JSON object with no extra text.

Rules:
- isTask: true only if message contains a clear actionable task or action item
- taskText: clean short description of the task
- assignedTo: person name if mentioned, null if not
- deadline: convert any deadline to ISO format (YYYY-MM-DDTHH:mm:ss.000Z) using today's date as reference. "tomorrow 5pm" should become an actual ISO date. null if no deadline mentioned
- urgency: "high" if today/urgent/asap, "medium" if tomorrow/soon, "low" otherwise
- confidence: 0 to 1 score of how confident you are this is a task

Return format:
{"isTask": bool, "taskText": string, "assignedTo": string|null, "deadline": string|null, "urgency": "high"|"medium"|"low", "confidence": number}`,
        },
        {
          role: "user",
          content: text,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const result = JSON.parse(content)
    return result
  } catch (error) {
    console.error("OpenAI error:", error)
    return null
  }
}

function keywordFallback(text: string) {
  const taskKeywords = [
    "remind", "submit", "send", "call", "meeting", "deadline", "finish",
    "complete", "review", "follow up", "prepare", "schedule", "update",
    "fix", "check", "make sure", "don't forget", "need to", "have to",
    "please", "urgent", "asap", "by today", "by tomorrow", "before",
  ]

  const highWords = ["urgent", "asap", "immediately", "today", "right now", "critical"]
  const mediumWords = ["tomorrow", "soon", "this week", "by eod", "end of day"]

  const lowerText = text.toLowerCase()
  const isTask = taskKeywords.some(k => lowerText.includes(k))
  const urgency = highWords.some(w => lowerText.includes(w))
    ? "high"
    : mediumWords.some(w => lowerText.includes(w))
    ? "medium"
    : "low"

  return {
    isTask,
    taskText: text,
    assignedTo: null,
    deadline: null,
    urgency,
    confidence: 0.6,
  }
}

async function checkRateLimit(organisationId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

    const recentCount = await sanityClient.fetch(
      `count(*[_type == "task" && organisation._ref == $orgId && createdAt > $oneHourAgo])`,
      { orgId: organisationId, oneHourAgo }
    )

    if (recentCount >= 50) {
      console.warn(`Rate limit hit for org ${organisationId}: ${recentCount} tasks in last hour`)
      return false
    }

    return true
  } catch (error) {
    console.error("Rate limit check error:", error)
    return true
  }
}

async function findOrCreateGroup(chatId: string, orgId: string) {
  const existing = await sanityClient.fetch(
    `*[_type == "group" && chatId == $chatId && organisation._ref == $orgId][0]`,
    { chatId, orgId }
  )

  if (existing) return existing._id

  const newGroup = await sanityClient.create({
    _type: "group",
    chatId,
    name: `Group ${chatId.slice(0, 8)}`,
    organisation: { _type: "reference", _ref: orgId },
    isMonitoring: true,
    messagesCount: 0,
    tasksExtracted: 0,
    completedTasksCount: 0,
    completionPercentage: 0,
    createdAt: new Date().toISOString(),
  })

  return newGroup._id
}

export async function POST(request: Request) {
  try {
    const { text, chatId, sender, messageId, timestamp, orgId } = await request.json()

    if (!text) {
      return NextResponse.json({ message: "No text provided" }, { status: 400 })
    }

    const organisationId = orgId || process.env.NEXT_PUBLIC_ORG_ID

    if (!organisationId) {
      return NextResponse.json({ message: "No organisation ID" }, { status: 400 })
    }

    // Check if message already processed to prevent loops
    const alreadyProcessed = await sanityClient.fetch(
      `*[_type == "task" && messageId == $messageId][0]`,
      { messageId: messageId || "" }
    )

    if (alreadyProcessed) {
      return NextResponse.json({ message: "Already processed", isTask: false })
    }

    // Check rate limit before calling OpenAI
    const withinLimit = await checkRateLimit(organisationId)
    if (!withinLimit) {
      return NextResponse.json({
        message: "Rate limit exceeded. Max 50 tasks per hour per organisation.",
        isTask: false,
      }, { status: 429 })
    }

    // Step 1: Analyze with GPT-4o-mini
    let analysis = await analyzeMessage(text)

    // Step 2: Fall back to keywords if OpenAI fails
    if (!analysis) {
      console.log("OpenAI failed, using keyword fallback")
      analysis = keywordFallback(text)
    }

    console.log("Analysis result:", analysis)

    if (!analysis.isTask || analysis.confidence < 0.5) {
      return NextResponse.json({ isTask: false, message: "Not a task" })
    }

    // Step 3: Find or create group
    const groupId = await findOrCreateGroup(chatId || "unknown", organisationId)

    // Step 4: Parse deadline if present
    let deadlineISO = null
    if (analysis.deadline) {
      try {
        const parsed = new Date(analysis.deadline)
        if (!isNaN(parsed.getTime())) {
          deadlineISO = parsed.toISOString()
        }
      } catch {
        deadlineISO = null
      }
    }

    // Step 5: Save task to Sanity
    const task = await sanityClient.create({
      _type: "task",
      organisation: { _type: "reference", _ref: organisationId },
      group: { _type: "reference", _ref: groupId },
      taskText: analysis.taskText || text,
      assignedTo: analysis.assignedTo,
      deadline: deadlineISO,
      urgency: analysis.urgency || "low",
      status: "pending",
      source: "ai",
      whatsappStatus: "awaiting_response",
      originalMessage: text,
      messageId: messageId || `msg_${Date.now()}`,
      sender: sender || "unknown",
      confidence: analysis.confidence,
      timeline: [
        {
          event: "Task extracted from WhatsApp message",
          timestamp: new Date().toISOString(),
          actor: "system",
        },
      ],
      actionsLog: [],
      createdAt: new Date().toISOString(),
    })

    // Step 6: Update group task count
    await sanityClient
      .patch(groupId)
      .inc({ tasksExtracted: 1 })
      .commit()

    return NextResponse.json({
      isTask: true,
      taskId: task._id,
      task,
      message: "Task extracted and saved successfully",
    })
  } catch (error) {
    console.error("Process error:", error)
    return NextResponse.json({ message: "Processing failed" }, { status: 500 })
  }
}