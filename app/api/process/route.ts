import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import OpenAI from "openai"
import stringSimilarity from "string-similarity"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const IMMEDIATE_KEYWORDS = [
  "now",
  "right now",
  "asap",
  "immediately",
  "right away",
  "urgent",
  "priority",
  "highest priority",
  "critical",
  "hotfix",
  "blocker",
]

function isImmediateIntent(text: string): boolean {
  const lower = text.toLowerCase()
  return IMMEDIATE_KEYWORDS.some((kw) => lower.includes(kw))
}

const ASSIGNEE_STOP_WORDS = new Set([
  "now",
  "asap",
  "urgent",
  "urgently",
  "critical",
  "immediately",
  "right away",
  "today",
  "tomorrow",
  "tonight",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
])

function isStopWord(word: string): boolean {
  if (!word) return false
  return ASSIGNEE_STOP_WORDS.has(word.toLowerCase().trim())
}

function parseDeadline(raw: string | null): string | null {
  if (!raw) return null
  try {
    const parsed = new Date(raw)
    return isNaN(parsed.getTime()) ? null : parsed.toISOString()
  } catch {
    return null
  }
}

function resolveDeadlineAndImmediate(
  rawDeadline: string | null,
  messageText: string,
  urgency?: "high" | "medium" | "low" | null
): { deadlineISO: string | null; immediate: boolean } {
  let deadlineISO = parseDeadline(rawDeadline)
  const immediate = (isImmediateIntent(messageText) || urgency === "high") && !deadlineISO
  if (immediate) {
    deadlineISO = new Date(Date.now() + 10 * 60 * 1000).toISOString()
  }
  return { deadlineISO, immediate }
}

function calculateUrgency(
  deadlineISO: string | null,
  gptUrgency: "high" | "medium" | "low" | null,
  immediate: boolean
): "high" | "medium" | "low" {
  let calculated: "high" | "medium" | "low" = "low"

  if (immediate) {
    calculated = "high"
  } else if (deadlineISO) {
    const hoursRemaining =
      (new Date(deadlineISO).getTime() - Date.now()) / (1000 * 60 * 60)
    if (hoursRemaining <= 24) calculated = "high"
    else if (hoursRemaining <= 72) calculated = "medium"
  }

  const rank: Record<string, number> = { high: 3, medium: 2, low: 1 }
  const gpt = gptUrgency || "low"
  return rank[gpt] >= rank[calculated] ? gpt : calculated
}

function calculateReminder(
  deadlineISO: string | null,
  urgency: "high" | "medium" | "low",
  immediate: boolean
): string | null {
  let reminderAt: string | null = null

  if (immediate) {
    reminderAt = deadlineISO
  } else if (deadlineISO) {
    const dl = new Date(deadlineISO).getTime()
    if (urgency === "high") {
      reminderAt = new Date(dl - 2 * 60 * 60 * 1000).toISOString()
    } else if (urgency === "medium") {
      reminderAt = new Date(dl - 12 * 60 * 60 * 1000).toISOString()
    } else {
      reminderAt = new Date(dl - 24 * 60 * 60 * 1000).toISOString()
    }
  }


  if (reminderAt && new Date(reminderAt).getTime() < Date.now()) {
    reminderAt = new Date().toISOString()
  }

  return reminderAt
}

async function analyzeMessage(
  text: string,
  conversationContext: string
) {
  try {
    const todayDate = new Date().toISOString().split("T")[0]

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1000,
      temperature: 0,
      messages: [
        {
          role: "system",
          content: `You are a task extraction assistant for WhatsApp group messages.
Today's date is ${todayDate}.
All times in messages are IST. Return ALL deadlines as UTC ISO timestamps.
Relative durations ("in 15 minutes", "after 2 hours") are relative to current time.
Previous messages are context only. Analyze the current message and return ONLY a JSON object.

RETURN FORMAT:
{
  "isTask": boolean,
  "action": "new_task" | "update_task" | "complete_task" | "not_task" | "ambiguous_update" | "multiple_tasks" | "reassign_task",
  "targetTask": string|null,
  "taskText": string|null,
  "assignedTo": string|null,
  "deadline": string|null,
  "urgency": "high"|"medium"|"low"|null,
  "confidence": number
}

FIELD RULES:
- taskText: short description of the actual work. Never use generic words like "task", "this task", "do task".
- assignedTo: person name if mentioned, null otherwise.
- deadline: ISO format (YYYY-MM-DDTHH:mm:ss.000Z). null if none mentioned. Do NOT invent deadlines.
- urgency: "high" if today/urgent/asap/now/immediately/right away/priority/critical, "medium" if tomorrow/soon, "low" otherwise.
- confidence: 0-1 score.

DATE/TIME HANDLING (IST → UTC):
- "today" / "by EOD" / "this evening" → today 6 PM IST
- "tomorrow" → tomorrow's date
- "next Monday" / "Friday" → upcoming weekday
- "5 PM" → today 5 PM IST (tomorrow if past)
- "noon" → 12 PM IST, "midnight" → 11:59 PM IST

IMMEDIATE INTENT:
Words like "now", "ASAP", "immediately", "right away", "urgent", "priority", "critical":
- Set deadline to null (backend handles 10-min offset).
- Set urgency to "high". Never downgrade.

TASK DETECTION — only mark isTask=true if:
- Someone is explicitly assigned work or requested to perform an action
- A deliverable or deadline-bound action is mentioned
- Imperative sentences without an explicit assignee (e.g. "Fix login bug", "Review PR", "Complete finance work") should still be treated as new_task with assignedTo = null.
Do NOT mark isTask=true for: suggestions, brainstorming, opinions, feedback, status updates, completed work, general discussion, questions without action requests.
If uncertain, return isTask=false.

ACTION DEFINITIONS:

new_task — Creates a new task.
- Name + action verb = ALWAYS new_task, even if a similar task exists.
- "Rahul fix login bug" → new_task
- "Sahil complete deployment" → new_task (assignment, NOT completion)
- Common action verbs: fix, check, review, test, complete, finish, prepare, submit, send, deploy, update, create, build, design, verify, investigate, call, follow up

update_task — Modifies an existing task (deadline, assignee, details).
- Messages starting with update/change/reschedule verbs (e.g. "Move deadline", "Change deadline", "Reschedule") MUST use update_task (if target task is clear) or ambiguous_update (if multiple tasks match), NEVER new_task.
- targetTask MUST be identified and exist in context.
- If target is unclear among multiple tasks → return ambiguous_update.
- "Move deadline to Friday" → update_task (if target is clear)

complete_task — Work is clearly ALREADY finished or being marked as completed.
- "Done", "Completed", "Bug fixed", "Deployment completed", "Mark done", "Complete [task]" → complete_task
- targetTask MUST be identified.
- "Rahul complete deployment" is new_task (assignment), NOT complete_task.

reassign_task — Changes ownership of an existing task.
- ONLY classify as reassign_task if the target task is clearly present in the previous conversation context list. Otherwise, classify as new_task.
- Messages starting with Assign/Reassign/Give/Move + task + to + person.
- "Assign testing to Rahul" (if "testing" is in the context list) → reassign_task
- "Give checkout bug to Rahul" (if "checkout bug" is in the context list) → reassign_task

not_task — Discussion, opinion, suggestion, general conversation.

ambiguous_update — Multiple tasks match and target cannot be determined.
- Return: { "isTask": false, "action": "ambiguous_update", "targetTask": null, "confidence": 1 }
- Never guess.

MULTIPLE TASKS:
If a message contains 2+ independent task assignments, return:
{
  "isTask": true,
  "action": "multiple_tasks",
  "tasks": [
    { "taskText": "...", "assignedTo": "...", "deadline": "...", "urgency": "...", "confidence": 0.95 }
  ]
}
Detection rules:
- Multiple names each followed by an action → multiple_tasks
- Line breaks, periods, or conjunctions separating assignments or actions → multiple_tasks
- A single person assigned multiple actions, or multiple independent tasks (e.g., "Rahul review PR and deploy backend tomorrow and update README Friday") → multiple_tasks with a separate task object for each action (e.g., review PR, deploy backend, update README).
- "X do A and Y do B" → multiple_tasks
- Never merge multiple assignments or actions into one task.
- Never return only the first task.

MIXED MESSAGES: Extract only the task portion, ignore conversational parts.

CONTEXT PRIORITY: Current message > Previous context. Never convert an explicit assignment into an update based on previous tasks.

NAME MATCHING: Treat slight misspellings (sahil/sahul/sahill) as the same person. Extract name exactly as written.

EXAMPLES:

"Aadhya finish UI today. Rahul test APIs by 8 PM. Priya update docs tomorrow."
→ { "action": "multiple_tasks", "tasks": [3 objects with respective assignees/deadlines] }

"Sahil submit the report"
→ { "action": "new_task", "taskText": "submit the report", "assignedTo": "Sahil", "deadline": null, "urgency": "low" }

"Complete finance work"
→ { "action": "new_task", "taskText": "complete finance work", "assignedTo": null, "deadline": null, "urgency": "low" }

"Test the payment flow now"
→ { "action": "new_task", "taskText": "test the payment flow", "assignedTo": null, "deadline": null, "urgency": "high" }

"Assign designing to Sahil"
→ { "action": "reassign_task", "targetTask": "designing", "assignedTo": "Sahil" }

"Move the deadline to Friday" (multiple pending tasks, target unclear)
→ { "action": "ambiguous_update", "targetTask": null }

"Done" (one pending task: "submit the report")
→ { "action": "complete_task", "targetTask": "submit the report" }

"The dashboard looks great"
→ { "action": "not_task" }

"Hey team, great work! Rahul please fix the login bug by tomorrow."
→ { "action": "new_task", "taskText": "fix the login bug", "assignedTo": "Rahul" }

"Rahul review PR and deploy backend tomorrow and update README Friday"
→ {
  "action": "multiple_tasks",
  "tasks": [
    { "taskText": "review PR", "assignedTo": "Rahul", "deadline": null, "urgency": "low" },
    { "taskText": "deploy backend", "assignedTo": "Rahul", "deadline": "tomorrow's date", "urgency": "medium" },
    { "taskText": "update README", "assignedTo": "Rahul", "deadline": "Friday's date", "urgency": "low" }
  ]
}
`,
        },
        {
          role: "user",
          content: `
Previous conversation:

${conversationContext}

Current message:

${text}
`,
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    try {
      return JSON.parse(content)
    } catch (err) {
      console.error("Failed to parse GPT response:", content)
      return null
    }
  } catch (error) {
    console.error("OpenAI error:", error)
    return null
  }
}


function cleanTaskTextRules(text: string): string {
  if (!text) return ""
  let clean = text.trim()

  // Remove unnecessary leading helper words repeatedly
  let changed = true
  while (changed) {
    changed = false
    const leadingRegex = /^(please|can\s+you|could\s+you|need\s+to|should|will|assign|make\s+sure\s+to|make\s+sure)\b/i
    const match = clean.match(leadingRegex)
    if (match) {
      clean = clean.replace(leadingRegex, "").trim()
      changed = true
    }
  }

  // Remove any leading punctuation that might be left over
  clean = clean.replace(/^[:,\-\s]+/, "").trim()
  return clean
}

function extractAndCleanTask(
  taskText: string | null,
  assignedTo: string | null,
  hasDeadline: boolean
): { taskText: string | null; assignedTo: string | null } {
  let text = taskText ? taskText.trim() : ""
  let assignee = assignedTo ? assignedTo.trim() : null

  // If assignee is a stop word, nullify it
  if (assignee && isStopWord(assignee)) {
    assignee = null
  }

  // If assignee is not yet set, try to extract candidate assignee from taskText
  if (!assignee && text) {
    // Look for patterns like "assigned to Name", "assign to Name", "to Name", "for Name"
    const assignPattern = /\b(?:[aA][sS][sS][iI][gG][nN][eE][dD]\s+[tT][oO]|[aA][sS][sS][iI][gG][nN]\s+[tT][oO]|[tT][oO]|[fF][oO][rR])\s+([A-Z][a-zA-Z.\-]*(?:\s+[A-Z][a-zA-Z.\-]*)*)\b/
    const assignMatch = text.match(assignPattern)
    if (assignMatch && !isStopWord(assignMatch[1])) {
      assignee = assignMatch[1]
    } else {
      // Look for modal verb patterns like "can Name review", "should Name fix", etc.
      const modalPattern = /\b(?:[cC][aA][nN]|[cC][oO][uU][lL][dD]|[sS][hH][oO][uU][lL][dD]|[wW][iI][lL][lL]|[pP][lL][eE][aA][sS][eE])\s+([A-Z][a-zA-Z.\-]*(?:\s+[A-Z][a-zA-Z.\-]*)*)\s+(?:fix|check|review|test|complete|finish|prepare|submit|send|deploy|update|create|build|design|verify|investigate|call|follow\s+up|make|do)\b/
      const modalMatch = text.match(modalPattern)
      if (modalMatch && !isStopWord(modalMatch[1])) {
        assignee = modalMatch[1]
      } else {
        // Look for capitalized name at the very end of the string (e.g. "Finish UI Rahul Kumar")
        const words = text.split(/\s+/)
        let collected: string[] = []
        for (let i = words.length - 1; i >= 0; i--) {
          const w = words[i].replace(/[^\w.\-]/g, "")
          if (w && (/^[A-Z][a-z]/.test(w) || /^[A-Z]\./.test(w)) && !isStopWord(w)) {
            collected.unshift(words[i])
          } else {
            break
          }
        }
        if (collected.length > 0) {
          assignee = collected.join(" ").replace(/[^\w\s.\-]/g, "").trim()
        }
      }
    }
  }

  // If we have an assignee candidate, remove the assignee and prepositions from the task text
  if (assignee) {
    const escapedAssignee = assignee.replace(/[/\-\\^$*+?.()|[\]{}]/g, '\\$&')
    const patterns = [
      new RegExp(`\\b(?:[aA][sS][sS][iI][gG][nN][eE][dD]\\s+[tT][oO]|[aA][sS][sS][iI][gG][nN]\\s+[tT][oO]|[tT][oO]|[fF][oO][rR])\\s+${escapedAssignee}\\b`),
      new RegExp(`\\b${escapedAssignee}\\b`)
    ]
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        text = text.replace(pattern, "").replace(/\s+/g, " ").trim()
        break
      }
    }
  }

  // Clean deadline phrases if there is a deadline
  if (hasDeadline && text) {
    const deadlineRegexes = [
      /\b(?:by|on|at|before|due|for)?\s*(?:today|tomorrow|tonight|eod|end\s+of\s+(?:the\s+)?day|this\s+evening|next\s+week)\b/i,
      /\b(?:by|on|at|before|due|for)?\s*(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+morning|\s+afternoon|\s+evening|\s+night)?\b/i,
      /\b(?:by|on|at|before|due|for)?\s*(?:noon|midnight|\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM))\b/i,
      /\b(?:in|after)\s+\d+\s+(?:minute|hour|day)s?\b/i,
    ]
    for (const regex of deadlineRegexes) {
      text = text.replace(regex, "")
    }
    text = text.replace(/\s+/g, " ").trim()
  }

  // Apply general helper verb / word cleaning rules
  text = cleanTaskTextRules(text)

  // Clean up trailing punctuation left behind
  text = text.replace(/[:,\-\s]+$/, "").trim()

  return {
    taskText: text || null,
    assignedTo: assignee,
  }
}

async function resolveAssignee(
  assignee: string | null,
  organisationId: string,
  prefetchedUsers?: any[]
) {
  if (!assignee) return null
  if (isStopWord(assignee)) return null

  const users: { name: string }[] =
  prefetchedUsers ??
  (await sanityClient.fetch<{ name: string }[]>(
    `*[_type == "user" && organisation._ref == $orgId]{
      name
    }`,
    { orgId: organisationId }
  )) ??
  []

  const names = users.map((u: any) => u.name)

  if (names.length === 0) {
    return assignee
  }

  const match = stringSimilarity.findBestMatch(
    assignee.toLowerCase(),
    names.map((n: string) => n.toLowerCase())
  )

  if (match.bestMatch.rating > 0.75) {
    return names[match.bestMatchIndex]
  }

  return assignee
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

async function findOrCreateGroup(
  chatId: string,
  orgId: string,
  groupName?: string
) {
  const existing = await sanityClient.fetch(
    `*[_type == "group" && chatId == $chatId && organisation._ref == $orgId][0]`,
    { chatId, orgId }
  )

  if (existing) return existing._id

  const newGroup = await sanityClient.create({
    _type: "group",
    chatId,
    name: groupName || chatId,
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


interface SingleTaskInput {
  taskText: string | null
  assignedTo: string | null
  deadline: string | null
  urgency: "high" | "medium" | "low" | null
  confidence: number
}

interface PipelineContext {
  originalMessage: string
  messageId: string
  sender: string
  organisationId: string
  groupId: string
  messageIdSuffix?: string
  immediateMessageText?: string
}

async function createTaskFromAnalysis(
  input: SingleTaskInput,
  ctx: PipelineContext
) {
  
  const resolvedAssignee = input.assignedTo

  const { deadlineISO, immediate } = resolveDeadlineAndImmediate(
    input.deadline,
    ctx.immediateMessageText || ctx.originalMessage,
    input.urgency
  )


  const existingTasks = await sanityClient.fetch(
    `*[
      _type == "task" &&
      group._ref == $groupId &&
      status == "pending"
    ]{
      _id,
      taskText,
      assignedTo
    }`,
    { groupId: ctx.groupId }
  )

  const normalizedNewTask =
    input.taskText
      ?.toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim() || ""

  let duplicateTask = null

  for (const task of existingTasks) {
    const normalizedExisting =
      task.taskText
        ?.toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim() || ""

    const similarity = stringSimilarity.compareTwoStrings(
      normalizedNewTask,
      normalizedExisting
    )

    if (similarity > 0.8) {
  const existingAssignee = (task.assignedTo || "").trim().toLowerCase()
  const newAssignee = (resolvedAssignee || "").trim().toLowerCase()

  const sameAssignee =
    existingAssignee === newAssignee

  const bothUnassigned =
    !existingAssignee && !newAssignee

  if (sameAssignee || bothUnassigned) {
    duplicateTask = task
    break
  }
}
  }

  if (duplicateTask) {
    console.warn(`Duplicate task detected, skipping: "${normalizedNewTask}" (matches existing task ID: ${duplicateTask._id}, text: "${duplicateTask.taskText}", assignee: ${duplicateTask.assignedTo || "unassigned"})`)
    return null
  }


  const finalUrgency = calculateUrgency(deadlineISO, input.urgency, immediate)


  const reminderAt = calculateReminder(deadlineISO, finalUrgency, immediate)


  const effectiveMessageId = ctx.messageIdSuffix
    ? `${ctx.messageId}${ctx.messageIdSuffix}`
    : ctx.messageId

  const task = await sanityClient.create({
    _type: "task",
    organisation: { _type: "reference", _ref: ctx.organisationId },
    group: { _type: "reference", _ref: ctx.groupId },
    taskText: input.taskText || ctx.originalMessage,
    assignedTo: resolvedAssignee,
    deadline: deadlineISO,
    reminderAt,
    urgency: finalUrgency,
    status: "pending",
    source: "ai",
    whatsappStatus: "pending",
    originalMessage: ctx.originalMessage,
    messageId: effectiveMessageId,
    sender: ctx.sender || "unknown",
    confidence: input.confidence,
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




  await sanityClient
    .patch(ctx.groupId)
    .setIfMissing({ tasksExtracted: 0 })
    .inc({ tasksExtracted: 1 })
    .commit()

  await sanityClient.create({
    _type: "activity",
    organisation: {
      _type: "reference",
      _ref: ctx.organisationId,
    },
    type: "task_created",
    title: "Task Extracted",
    description: `${input.taskText} assigned to ${
      resolvedAssignee || "Unassigned"
    }`,
    group: {
      _type: "reference",
      _ref: ctx.groupId,
    },
    task: {
      _type: "reference",
      _ref: task._id,
    },
    createdAt: new Date().toISOString(),
  })

  return task
}


export async function POST(request: Request) {
  try {
    const {
      text,
      chatId,
      groupName,
      sender,
      messageId,
      timestamp,
      orgId,
    } = await request.json()

    const lowerText = text.toLowerCase().trim()


    const reassignMatch =
      lowerText.match(/^assign\s+(.+?)\s+to\s+(.+)$/)

    if (reassignMatch) {
      const taskName = reassignMatch[1].trim()
      const assignee = reassignMatch[2].trim()

      const targetTask = await sanityClient.fetch(
        `*[
          _type == "task" &&
          group->chatId == $chatId &&
          status == "pending" &&
          taskText match $taskText
        ][0]`,
        {
          chatId,
          taskText: `*${taskName}*`,
        }
      )

      if (targetTask) {
        await sanityClient
          .patch(targetTask._id)
          .set({
            assignedTo: assignee,
          })
          .commit()

        return NextResponse.json({
          success: true,
          action: "reassign_task",
          taskId: targetTask._id,
        })
      }
    }

    if (!text || text.trim() === "") {
      return NextResponse.json({
        isTask: false,
        message: "No text content"
      })
    }

    if (!text) {
      return NextResponse.json({ message: "No text provided" }, { status: 400 })
    }


    const organisationId =
      orgId || process.env.NEXT_PUBLIC_ORG_ID

    if (!organisationId) {
      return NextResponse.json({ message: "No organisation ID" }, { status: 400 })
    }

    const alreadyProcessed = await sanityClient.fetch(
      `*[_type == "task" && messageId == $messageId][0]{
        _id,
        originalMessage
      }`,
      { messageId: messageId || "" }
    )

    const isEditedMessage =
      alreadyProcessed &&
      alreadyProcessed.originalMessage !== text

    if (alreadyProcessed) {
      if (isEditedMessage) {
        await sanityClient.delete({
          query: `*[_type == "task" && (messageId == $messageId || messageId match $messageIdSuffix)]`,
          params: {
            messageId: messageId || "",
            messageIdSuffix: `${messageId}-*`
          }
        })
      } else {
        return NextResponse.json({
          message: "Already processed",
          isTask: false
        })
      }
    }

    const withinLimit = await checkRateLimit(organisationId)
    if (!withinLimit) {
      return NextResponse.json({
        message: "Rate limit exceeded. Max 50 tasks per hour per organisation.",
        isTask: false,
      }, { status: 429 })
    }

    const previousTasks = await sanityClient.fetch(
      `*[_type == "task"
        && group->chatId == $chatId]
       | order(createdAt desc)[0...5]{
          taskText,
          assignedTo,
          deadline,
          status
       }`,
      { chatId }
    )

    const conversationContext = previousTasks
      .map((task: any, index: number) => `
Task ID: ${index + 1}
Task: ${task.taskText}
Assigned To: ${task.assignedTo || "Unknown"}
Deadline: ${task.deadline || "None"}
Status: ${task.status || "pending"}
`)
      .join("\n")


    const explicitAssignmentRegex =
      /^([a-zA-Z]+)\s+(fix|check|review|test|complete|finish|prepare|submit|send|deploy|update|create|build|design|verify|investigate|call|follow\s+up|make|do)\b/i

    const explicitMatch = text.trim().match(explicitAssignmentRegex)
    const isExplicitAssigneeStopWord = explicitMatch && isStopWord(explicitMatch[1])

    const multipleAssignments =
      text.split(/\n|\./).filter(Boolean).length > 1

    let analysis

    if (explicitMatch && !multipleAssignments && !isExplicitAssigneeStopWord) {
      const assignee = explicitMatch[1]

      const taskText = text
        .replace(new RegExp(`^${assignee}\\s+`, "i"), "")
        .trim()

      const gptDeadlineAnalysis =
        await analyzeMessage(
          text,
          conversationContext
        )

      analysis = {
        isTask: true,
        action: "new_task",
        targetTask: null,
        taskText,
        assignedTo: assignee,
        deadline: gptDeadlineAnalysis?.deadline || null,
        urgency: gptDeadlineAnalysis?.urgency || null,
        confidence: 1,
      }

    } else {
      analysis = await analyzeMessage(
        text,
        conversationContext
      )
    }

    if (!analysis) {
      analysis = keywordFallback(text)
    }

    if (analysis) {
      if (analysis.action === "multiple_tasks" && Array.isArray(analysis.tasks)) {
        for (let i = 0; i < analysis.tasks.length; i++) {
          const current = analysis.tasks[i]
          const cleaned = extractAndCleanTask(
            current.taskText,
            current.assignedTo,
            !!current.deadline
          )
          current.taskText = cleaned.taskText
          current.assignedTo = cleaned.assignedTo
        }
      } else {
        const cleaned = extractAndCleanTask(
          analysis.taskText,
          analysis.assignedTo,
          !!analysis.deadline
        )
        analysis.taskText = cleaned.taskText
        analysis.assignedTo = cleaned.assignedTo
      }
    }

    let cachedUsers: { name: string }[] | undefined

    if (analysis?.assignedTo) {
      cachedUsers = await sanityClient.fetch(
        `*[_type == "user" && organisation._ref == $orgId]{
          name
        }`,
        { orgId: organisationId }
      )
      analysis.assignedTo = await resolveAssignee(
        analysis.assignedTo,
        organisationId,
        cachedUsers
      )
    }

    if (analysis.action === "ambiguous_update") {
      return NextResponse.json({
        success: false,
        action: "ambiguous_update",
        message: "Multiple tasks match. Need clarification."
      })
    }

    if (analysis.action === "complete_task") {
      let targetTask = null
      
      if (analysis.targetTask) {
        targetTask = await sanityClient.fetch(
          `*[
            _type == "task" &&
            group->chatId == $chatId &&
            status == "pending" &&
            taskText match $taskText
          ][0]`,
          {
            chatId,
            taskText: `*${analysis.targetTask}*`,
          }
        )
      }

      if (!targetTask) {
        // Fallback to the most recent pending task in the group
        targetTask = await sanityClient.fetch(
          `*[_type == "task" && group->chatId == $chatId && status == "pending"] | order(createdAt desc)[0]`,
          { chatId }
        )
      }

      if (targetTask) {
        await sanityClient
          .patch(targetTask._id)
          .set({
            status: "completed",
            completedAt: new Date().toISOString(),
          })
          .commit()

        return NextResponse.json({
          success: true,
          action: "complete_task",
          taskId: targetTask._id,
        })
      } else {
        return NextResponse.json({
          success: false,
          action: "complete_task",
          message: "No pending tasks found to complete.",
        })
      }
    }


    if (analysis.action === "update_task") {
      const targetTask = await sanityClient.fetch(
        `*[
          _type == "task" &&
          group->chatId == $chatId &&
          status == "pending" &&
          taskText match $taskText
        ][0]`,
        {
          chatId,
          taskText: `*${analysis.targetTask}*`,
        }
      )

      if (!targetTask) {
        return NextResponse.json({
          success: false,
          action: "update_task",
          message: "Target task not found",
        })
      }

      const updateData: Record<string, any> = {}
      const { deadlineISO, immediate } = resolveDeadlineAndImmediate(
  analysis.deadline,
  text
)

const finalUrgency = calculateUrgency(
  deadlineISO,
  analysis.urgency,
  immediate
)

const reminderAt = calculateReminder(
  deadlineISO,
  finalUrgency,
  immediate
)

     if (deadlineISO) {
  updateData.deadline = deadlineISO
}

updateData.urgency = finalUrgency
updateData.reminderAt = reminderAt

      if (analysis.assignedTo) {
        updateData.assignedTo = analysis.assignedTo
      }

      await sanityClient
        .patch(targetTask._id)
        .set(updateData)
        .commit()

      return NextResponse.json({
        success: true,
        action: "update_task",
        taskId: targetTask._id,
      })
    }

    if (analysis.action === "reassign_task") {
      const targetTask = await sanityClient.fetch(
        `*[
          _type == "task" &&
          group->chatId == $chatId &&
          status == "pending" &&
          taskText match $taskText
        ][0]`,
        {
          chatId,
          taskText: `*${analysis.targetTask}*`,
        }
      )

      if (targetTask) {
        await sanityClient
          .patch(targetTask._id)
          .set({
            assignedTo: analysis.assignedTo,
          })
          .commit()

        return NextResponse.json({
          success: true,
          action: "reassign_task",
          taskId: targetTask._id,
        })
      } else {
  if (!analysis.targetTask) {
    return NextResponse.json({
      success: false,
      message: "Unable to determine task to create.",
    })
  }

  console.warn(
    `Reassign target "${analysis.targetTask}" not found. Falling back to new task creation.`
  )

  analysis.action = "new_task"

  const cleanedFallback = extractAndCleanTask(
    analysis.targetTask,
    analysis.assignedTo,
    !!analysis.deadline
  )

  analysis.taskText = cleanedFallback.taskText
  analysis.assignedTo = cleanedFallback.assignedTo
}
    }

    if (!analysis.isTask || analysis.confidence < 0.5) {
      return NextResponse.json({ isTask: false, message: "Not a task" })
    }


    const groupId = await findOrCreateGroup(
      chatId || "unknown",
      organisationId,
      groupName
    )

    if (groupName) {
      await sanityClient
        .patch(groupId)
        .set({
          name: groupName,
        })
        .commit()
    }


    // Edited message handling is now processed at the start of the handler
    // by deleting the previous tasks and letting them recreate fresh.


    const pipelineCtx: PipelineContext = {
      originalMessage: text,
      messageId: messageId || `msg_${Date.now()}`,
      sender: sender || "unknown",
      organisationId,
      groupId,
    }

    const createdTasks: any[] = []

    if (analysis.action === "multiple_tasks" && Array.isArray(analysis.tasks)) {

      for (let i = 0; i < analysis.tasks.length; i++) {
        const current = analysis.tasks[i]

        if (current.assignedTo && !cachedUsers) {
          cachedUsers = await sanityClient.fetch(
            `*[_type == "user" && organisation._ref == $orgId]{
              name
            }`,
            { orgId: organisationId }
          )
        }

        const resolvedAssignee = await resolveAssignee(
          current.assignedTo,
          organisationId,
          cachedUsers || undefined
        )

        const taskResult = await createTaskFromAnalysis(
          {
            taskText: current.taskText,
            assignedTo: resolvedAssignee,
            deadline: current.deadline || null,
            urgency: current.urgency || null,
            confidence: current.confidence ?? analysis.confidence ?? 0.9,
          },
          {
            ...pipelineCtx,
            messageIdSuffix: i === 0 ? undefined : `-${i}`,
            immediateMessageText: current.taskText || undefined,
          }
        )

        if (taskResult) {
          createdTasks.push(taskResult)
        }
      }
    } else {

      const taskResult = await createTaskFromAnalysis(
        {
          taskText: analysis.taskText,
          assignedTo: analysis.assignedTo,
          deadline: analysis.deadline || null,
          urgency: analysis.urgency || null,
          confidence: analysis.confidence,
        },
        pipelineCtx
      )

      if (taskResult) {
        createdTasks.push(taskResult)
      }
    }


    if (createdTasks.length === 0) {
      return NextResponse.json({
        isTask: false,
        message: "Duplicate task detected"
      })
    }

    return NextResponse.json({
      isTask: true,
      taskId: createdTasks[0]._id,
      task: createdTasks[0],
      tasks: createdTasks.length > 1 ? createdTasks : undefined,
      message:
        createdTasks.length === 1
          ? "Task extracted and saved successfully"
          : `${createdTasks.length} tasks extracted and saved successfully`,
    })
  } catch (error) {
    console.error("Process error:", error)
    return NextResponse.json({ message: "Processing failed" }, { status: 500 })
  }
}
