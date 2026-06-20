import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function analyzeMessage(
  text: string,
  conversationContext: string
)  {
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
You are analyzing a WhatsApp group conversation.

IMPORTANT:

All dates and times mentioned in messages are in Indian Standard Time (IST).

When a user says:
- "11 PM" → assume 11 PM IST
- "tomorrow 5 PM" → assume 5 PM IST tomorrow
- "today 8 PM" → assume 8 PM IST today

Return ALL deadlines as UTC ISO timestamps.

If the message contains:
- in 15 minutes
- by 15 minutes
- after 2 hours
- in 30 mins

convert it relative to the current time.

Examples:

"by 11 PM"
→ 2026-06-09T17:30:00.000Z

"tomorrow 5 PM"
→ 2026-06-10T11:30:00.000Z

Never return local times.
Always return UTC ISO strings.

Use previous messages as context to understand:
- task ownership
- deadline updates
- follow-up messages
- task completion messages
- references to previous tasks

The current message is the primary message being analyzed.
Previous messages are context only.
Analyze the message and return ONLY a JSON object with no extra text.

Only mark isTask=true if:
- Someone is explicitly assigned work
- Someone is requested to perform an action
- A deliverable is requested
- A reminder or follow-up action is requested
- A deadline-bound action is mentioned

Do NOT mark isTask=true for:
- Suggestions ("maybe we should...", "we should probably...")
- Brainstorming
- Ideas for the future
- Opinions
- Feedback
- Observations
- Status updates
- Completed work
- General discussion
- Feature requests without a clear assignee
- Questions that do not request a specific action

If uncertain whether a message is a task or discussion, return isTask=false.

- taskText: clean short description of the task
- assignedTo: person name if mentioned, null if not
- deadline: convert any deadline to ISO format (YYYY-MM-DDTHH:mm:ss.000Z) using today's date as reference. "tomorrow 5pm" should become an actual ISO date. null if no deadline mentioned
- urgency: "high" if today/urgent/asap, "medium" if tomorrow/soon, "low" otherwise
- confidence: 0 to 1 score of how confident you are this is a task

Return format:

{
  "isTask": boolean,
  "action": "new_task" | "update_task" | "complete_task" | "not_task" | "ambiguous_update" | "multiple_tasks" | "not_task",
  "targetTask": string|null,
  "taskText": string|null,
  "assignedTo": string|null,
  "deadline": string|null,
  "urgency": "high"|"medium"|"low"|null,
  "confidence": number
}

Messages that start with:

- Assign
- Reassign
- Give
- Move

are usually reassign_task actions, not new_task actions.

Examples:

"Assign testing to Rahul"
→ reassign_task

"Move deployment to Sahil"
→ reassign_task

"Give checkout bug to Rahul"
→ reassign_task

Definitions:

new_task:
- Creates a new task
If the current message assigns work to one or more people,
it is ALWAYS a new_task.

Examples:

"Rahul fix login bug"
→ new_task

"Sahil prepare investor deck"
→ new_task

"Rahul fix login bug and Sahil prepare investor deck"
→ new_task

Never classify an explicit assignment as update_task,
even if a similar task already exists.

update_task:
- Updates an existing task
- Changes deadline
- Changes assignee
- Adds details to a previous task

When updating an existing task:

You MUST identify which task is being updated.

If multiple tasks exist and the target task is unclear,
return:

{
  "isTask": false,
  "action": "ambiguous_update",
  "confidence": 1
}

Do NOT guess.

complete_task:
- Indicates a previously assigned task is completed

not_task:
- Discussion
- Opinion
- Suggestion
- General conversation

For update_task:
- targetTask MUST contain the task being updated.

For complete_task:
- targetTask MUST contain the task being completed.

IMPORTANT:

If a person's name appears before a verb, it is usually a new task assignment.

Examples:

"Rahul complete deployment"
→ new_task

"Sahil complete architecture"
→ new_task

"Azlan complete testing"
→ new_task

These are assignments, NOT completion messages.

Only classify as complete_task when the message clearly indicates work has already been finished.

Examples:

"Rahul completed deployment"
→ complete_task

"Deployment is done"
→ complete_task

"Testing finished"
→ complete_task

"Bug fixed"
→ complete_task

reassign_task:
- Changes ownership of an existing task
- Does NOT create a new task

TASK CLASSIFICATION RULES

The current message is ALWAYS more important than previous context.

Previous tasks are only used to:

* identify updates
* identify completions
* identify reassignments

Never use previous tasks to convert an explicit assignment into an update.

---

NEW TASK

A message is a new_task when:

* A person's name appears before an action verb
* Someone is assigned work
* Someone is requested to do something
* A deliverable is requested
* A deadline-bound action is assigned

Examples:

"Sahil test reminder"

"Isha check error by 2 PM"

"Rahul submit report"

"Sahil complete deployment"

"Rahul finish testing"

Response:

{
"isTask": true,
"action": "new_task"
}

IMPORTANT:

If a person's name appears at the start of the message and is followed by an action verb, ALWAYS classify as new_task.

Common action verbs:

fix
check
review
test
complete
finish
prepare
submit
send
deploy
update
create
build
design
verify
investigate
call
follow up

Never classify these as update_task.

---

UPDATE TASK

A message is update_task only when it modifies an existing task.

Examples:

"Move deadline to Friday"

"Change deadline to tomorrow"

"Assign this task to Rahul"

"Add testing notes"

Requirements:

* targetTask must be identified
* targetTask must exist in context

If targetTask cannot be identified confidently:

{
"isTask": false,
"action": "ambiguous_update",
"targetTask": null,
"confidence": 1
}

Never guess.

---

COMPLETE TASK

A message is complete_task only when work is clearly already finished.

Examples:

"Done"

"Completed"

"Finished"

"Bug fixed"

"Deployment completed"

"Testing is done"

Response:

{
"isTask": true,
"action": "complete_task"
}

IMPORTANT:

"Rahul complete deployment"

is NOT a completion.

It is:

{
"isTask": true,
"action": "new_task"
}

because Rahul is being assigned work.

---

REASSIGN TASK

A message is reassign_task when ownership changes.

Examples:

"Assign testing to Rahul"

"Give checkout bug to Rahul"

"Move deployment to Sahil"

Response:

{
"isTask": true,
"action": "reassign_task"
}

---

MULTIPLE TASKS

If multiple independent tasks appear:

"Sahil test login and Rahul prepare report"

Return:

{
"isTask": false,
"action": "multiple_tasks",
"confidence": 1
}

Do not extract only one task.

---

TASK TEXT RULES

taskText must describe actual work.

Never use:

* task
* this task
* that task
* complete task
* do task
* finish task

Bad:

{
"taskText": "complete the task"
}

Good:

{
"taskText": "complete deployment"
}

If actual work cannot be determined:

{
"isTask": false,
"action": "ambiguous_update"
}

---

CONTEXT PRIORITY

Current message > Previous context

Example:

Previous task:
"test reminder"

Current message:
"Sahil check error by 2 PM"

Response:

{
"action": "new_task",
"taskText": "check error",
"assignedTo": "Sahil"
}

Never convert this into an update to "test reminder".

---

NAME MATCHING

If a name is slightly misspelled:

sahil
sahul
sahill

Treat them as the same person if confidence is high.

Extract the name exactly as written.


Examples:

Current message:
"Assign designing to Sahil"

Response:
{
  "isTask": true,
  "action":"reassign_task",
  "targetTask":"designing",
  "taskText":null,
  "assignedTo":"Sahil",
  "deadline":null,
  "urgency":null,
  "confidence":0.9
}

Current message:
"Give checkout bug to Rahul"

Response:
{
  "isTask": true,
  "action":"reassign_task",
  "targetTask":"checkout bug",
  "taskText":null,
  "assignedTo":"Rahul",
  "deadline":null,
  "urgency":null,
  "confidence":0.9
}

If multiple active tasks exist and the referenced task cannot be determined with high confidence:
- action = "ambiguous_update"
- targetTask = null

Never guess.

If a message updates a task but does not explicitly mention the task
and there is more than one pending task in context:

Return:

{
  "isTask": false,
  "action": "ambiguous_update",
  "targetTask": null,
  "confidence": 1
}
  

If multiple independent tasks exist in one message:

Return:

{
  "isTask": false,
  "action": "multiple_tasks",
  "confidence": 1
}

Do not attempt to extract only one.

Examples:

Pending Tasks:
- prepare investor deck
- fix payment bug

Current message:
"Move the deadline to Friday"

Response:
{
  "isTask": false,
  "action": "ambiguous_update",
  "targetTask": null,
  "confidence": 1
}

Examples:

Current message:
"Sahil submit the report"

Response:
{
  "isTask": true,
  "action":"new_task",
  "taskText":"submit the report",
  "assignedTo":"Sahil",
  "deadline":null,
  "urgency":"low",
  "confidence":0.9
}

Current message:
"Deadline is tomorrow"

Previous context:
Task: submit the report

Response:
{
  "isTask": true,
  "action":"update_task",
  "targetTask":"submit the report",
  "taskText":null,
  "assignedTo":null,
  "deadline":"2026-06-06T00:00:00.000Z",
  "urgency":"medium",
  "confidence":0.9
}

Current message:
"Done"

Previous context:
Task: submit the report

Response:
{
  "isTask": true,
  "action":"complete_task",
  "targetTask":"submit the report",
  "taskText":null,
  "assignedTo":null,
  "deadline":null,
  "urgency":null,
  "confidence":0.9
}

Current message:
"Move the investor deck deadline to Monday"

Previous context:
Task: prepare investor deck
Task: fix login bug

Response:
{
  "isTask": true,
  "action":"update_task",
  "targetTask":"prepare investor deck",
  "taskText":null,
  "assignedTo":null,
  "deadline":"2026-06-09T00:00:00.000Z",
  "urgency":"medium",
  "confidence":0.9
}

Current message:
"The dashboard looks great"

Response:
{
  "isTask": false,
  "action":"not_task",
  "taskText":null,
  "assignedTo":null,
  "deadline":null,
  "urgency":null,
  "confidence":1
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

import stringSimilarity from "string-similarity"

async function resolveAssignee(
  assignee: string | null,
  organisationId: string
) {
  if (!assignee) return null

  const users = await sanityClient.fetch(
    `*[_type == "user" && organisation._ref == $orgId]{
      name
    }`,
    { orgId: organisationId }
  )

  console.log("USERS FOUND:", users)

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

console.log("PROCESS ORG:", organisationId)

    if (!organisationId) {
      return NextResponse.json({ message: "No organisation ID" }, { status: 400 })
    }

    // Check if message already processed to prevent loops
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

    if (alreadyProcessed && !isEditedMessage) {
  return NextResponse.json({
    message: "Already processed",
    isTask: false
  })
}

    // Check rate limit before calling OpenAI
    const withinLimit = await checkRateLimit(organisationId)
    if (!withinLimit) {
      return NextResponse.json({
        message: "Rate limit exceeded. Max 50 tasks per hour per organisation.",
        isTask: false,
      }, { status: 429 })
    }

    // Analyze with GPT-4o-mini
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

let analysis

if (explicitMatch) {
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
    confidence: 1,
  }

  console.log("RULE BASED TASK:", analysis)
}
else {
  analysis = await analyzeMessage(
    text,
    conversationContext
  )
}

    console.log("GPT ANALYSIS:", analysis)

if (analysis) {
  console.log("TARGET TASK:", analysis?.targetTask)
}
    console.log("CONTEXT:")
console.log(conversationContext)

    // Step 2: Fall back to keywords if OpenAI fails
    if (!analysis) {
      console.log("OpenAI failed, using keyword fallback")
      analysis = keywordFallback(text)
    }

    console.log("Analysis result:", analysis)

    if (analysis?.assignedTo) {
  analysis.assignedTo = await resolveAssignee(
    analysis.assignedTo,
    organisationId
  )
}

    if (analysis.action === "multiple_tasks") {
  return NextResponse.json({
    success: false,
    message: "Multiple tasks detected"
  })
}

    if (analysis.action === "ambiguous_update") {
  return NextResponse.json({
    success: false,
    action: "ambiguous_update",
    message: "Multiple tasks match. Need clarification."
  })
}

    if (analysis.action === "complete_task") {
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
        status: "completed",
        completedAt: new Date().toISOString(),
      })
      .commit()

    return NextResponse.json({
      success: true,
      action: "complete_task",
      taskId: targetTask._id,
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

  if (analysis.deadline) {
    updateData.deadline = analysis.deadline
  }

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

  if (!targetTask) {
    return NextResponse.json({
      success: false,
      message: "Target task not found",
    })
  }

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
}


    if (!analysis.isTask || analysis.confidence < 0.5) {
      return NextResponse.json({ isTask: false, message: "Not a task" })
    }

    //Find or create group
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

    //Parse deadline if present
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

    let resolvedAssignee = analysis.assignedTo
    

if (analysis.assignedTo) {
  const users = await sanityClient.fetch(
    `*[_type == "user" && organisation._ref == $orgId]{
      name
    }`,
    { orgId: organisationId }
  )

  const names = users.map((u: any) => u.name?.toLowerCase())

  const match = names.find(
    (name: string) =>
      name.includes(analysis.assignedTo.toLowerCase()) ||
      analysis.assignedTo.toLowerCase().includes(name)
  )

  if (match) {
    resolvedAssignee = match
  }
}

if (alreadyProcessed && isEditedMessage) {
  await sanityClient
    .patch(alreadyProcessed._id)
    .set({
      taskText: analysis.taskText,
      assignedTo: resolvedAssignee,
      deadline: deadlineISO,
      originalMessage: text,
      confidence: analysis.confidence,
    })
    .commit()

  return NextResponse.json({
    success: true,
    action: "edited_task",
    taskId: alreadyProcessed._id,
  })
}


const existingTasks = await sanityClient.fetch(
  `*[
    _type == "task" &&
    group._ref == $groupId &&
    assignedTo == $assignedTo &&
    status == "pending"
  ]{
    _id,
    taskText
  }`,
  {
    groupId,
    assignedTo: resolvedAssignee,
  }
)

    // Save task to Sanity
 const normalizedNewTask =
  analysis.taskText
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
    duplicateTask = task
    break
  }
}

if (duplicateTask) {
  return NextResponse.json({
    isTask: false,
    message: "Duplicate task detected"
  })
}

let calculatedUrgency: "high" | "medium" | "low" = "low"

if (deadlineISO) {
  const hoursRemaining =
    (new Date(deadlineISO).getTime() - Date.now()) /
    (1000 * 60 * 60)

  if (hoursRemaining <= 24) {
    calculatedUrgency = "high"
  } else if (hoursRemaining <= 72) {
    calculatedUrgency = "medium"
  } else {
    calculatedUrgency = "low"
  }
}

console.log("GPT URGENCY:", analysis.urgency)
console.log("FINAL URGENCY:", calculatedUrgency)

let reminderAt = null

if (deadlineISO) {
  const deadlineDate = new Date(deadlineISO)

  if (calculatedUrgency === "high") {
    reminderAt = new Date(
      deadlineDate.getTime() - 2 * 60 * 60 * 1000
    ).toISOString()
  } else if (calculatedUrgency === "medium") {
    reminderAt = new Date(
      deadlineDate.getTime() - 12 * 60 * 60 * 1000
    ).toISOString()
  } else {
    reminderAt = new Date(
      deadlineDate.getTime() - 24 * 60 * 60 * 1000
    ).toISOString()
  }
} else {
  reminderAt = new Date(
    Date.now() + 2 * 60 * 60 * 1000
  ).toISOString()
}

console.log("GPT URGENCY:", analysis.urgency)
console.log("FINAL URGENCY:", calculatedUrgency)
console.log("DEADLINE:", deadlineISO)
console.log("REMINDER AT:", reminderAt)

console.log("DEADLINE:", deadlineISO)
console.log("CALCULATED URGENCY:", calculatedUrgency)
console.log("REMINDER AT:", reminderAt)

console.log("PROCESS ORG:", organisationId)
const task = await sanityClient.create({
  
  _type: "task",
  organisation: { _type: "reference", _ref: organisationId },
  group: { _type: "reference", _ref: groupId },
  taskText: analysis.taskText || text,
  assignedTo: resolvedAssignee,
  deadline: deadlineISO,

  reminderAt, 

  urgency: calculatedUrgency,
  status: "pending",
  source: "ai",
  whatsappStatus: "pending",
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
console.log("GROUP ID USED FOR COUNTER:", groupId)
    //Update group task count
    await sanityClient
     .patch(groupId)
.setIfMissing({ tasksExtracted: 0 })
.inc({ tasksExtracted: 1 })
.commit()

await sanityClient.create({
  _type: "activity",

  organisation: {
    _type: "reference",
    _ref: organisationId,
  },

  type: "task_created",

  title: "Task Extracted",

  description: `${analysis.taskText} assigned to ${
    resolvedAssignee || "Unassigned"
  }`,

  group: {
    _type: "reference",
    _ref: groupId,
  },

  task: {
    _type: "reference",
    _ref: task._id,
  },

  createdAt: new Date().toISOString(),
})

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