# MindMe - AI Powered WhatsApp Task Manager

MindMe is a B2B SaaS platform that automatically extracts actionable tasks from WhatsApp group conversations using AI, organizes them into a structured to-do list, and sends smart deadline reminders back through WhatsApp and email.

---

## What it does

- Sits silently in WhatsApp groups as a bot participant
- Reads every message and uses GPT-4o-mini to detect tasks automatically
- Extracts who the task is assigned to, what the deadline is, and how urgent it is
- Saves all tasks to a database automatically with full timeline tracking
- Sends WhatsApp reminders before deadlines with reply options
- Users reply 1 to complete, 2 to snooze, 3 to reassign — all from WhatsApp
- Admin monitors everything on a real-time operational dashboard

---

## Tech Stack

| Layer          | Technology                               |
| -------------- | ---------------------------------------- |
| Frontend       | Next.js 15, shadcn/ui, Tailwind CSS      |
| Database       | Sanity                                   |
| Authentication | NextAuth.js (credentials + Google OAuth) |
| AI             | OpenAI GPT-4o-mini                       |
| WhatsApp       | Whapi.Cloud                              |
| Email          | AWS SES                                  |
| Scheduling     | Vercel Cron Jobs                         |
| Deployment     | Vercel                                   |

---

## Architecture

WhatsApp Group message arrives in group. Whapi detects it and sends webhook to /api/webhook. Message is cleaned and checked for replies. GPT-4o-mini analyzes the message via /api/process. Task is saved to Sanity with full metadata. Vercel Cron checks deadlines every hour. WhatsApp reminder sent via Whapi with 3 reply options. User replies 1, 2, or 3. Task updated in Sanity automatically. Admin sees everything on dashboard in real time.

---

## Pages

| Route              | Description                       |
| ------------------ | --------------------------------- |
| `/`                | Landing page                      |
| `/login`           | Login with phone, email or Google |
| `/signup`          | Register new account              |
| `/verify`          | Email OTP verification            |
| `/forgot-password` | Request password reset            |
| `/reset-password`  | Reset password with OTP           |
| `/onboarding`      | Setup wizard for new users        |
| `/dashboard`       | Operational overview              |
| `/tasks`           | All extracted tasks with filters  |
| `/groups`          | Monitored WhatsApp groups         |
| `/notifications`   | Reminder delivery history         |
| `/settings`        | Whapi connection and preferences  |

---

## API Routes

| Route                       | Method | Description                          |
| --------------------------- | ------ | ------------------------------------ |
| `/api/webhook`              | POST   | Receives Whapi messages              |
| `/api/process`              | POST   | GPT-4o-mini task extraction          |
| `/api/auth/register`        | POST   | User registration                    |
| `/api/auth/verify-otp`      | POST   | Email OTP verification               |
| `/api/auth/forgot-password` | POST   | Request password reset               |
| `/api/auth/reset-password`  | POST   | Reset password with OTP              |
| `/api/auth/check-user`      | POST   | Check if user exists and is verified |
| `/api/cron/reminders`       | GET    | Deadline reminder scheduler          |
| `/api/send-email`           | POST   | AWS SES email sender                 |
| `/api/setup`                | POST   | Organisation setup                   |
| `/api/tasks/update-status`  | POST   | Update task status                   |
| `/api/tasks/snooze`         | POST   | Snooze a task                        |
| `/api/tasks/reassign`       | POST   | Reassign a task                      |
| `/api/tasks/resend`         | POST   | Resend reminder                      |
| `/api/tasks/delete`         | POST   | Delete a task                        |
| `/api/tasks/edit-deadline`  | POST   | Edit task deadline                   |

---

## Environment Variables

Create a .env.local file in the root with these variables:

NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=
SANITY_API_TOKEN=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
WHAPI_API_TOKEN=
WHAPI_CHANNEL_URL=
AWS_REGION=
AWS_FROM_EMAIL=
OPENAI_API_KEY=
CRON_SECRET=
NEXT_PUBLIC_ORG_ID=

---

## Getting Started

Clone the repository from https://github.com/ishhh115/MineMe.git

Install dependencies with npm install

Copy environment variables to .env.local and fill in your values

Run development server with npm run dev

Open browser at http://localhost:3000

---

## Multi-Tenant Architecture

Each company that registers gets their own isolated Organisation document in Sanity. All tasks, groups, messages and notifications are scoped to their organisation ID. Zero data mixing between companies. Built to scale from single user to enterprise.

---

## WhatsApp Reminder Format

When a deadline approaches the bot sends a message to the WhatsApp group with the task name, assigned person, deadline, group name, and three reply options. Reply 1 marks the task as done. Reply 2 snoozes it for 2 hours. Reply 3 logs a reassign request. The task updates in Sanity automatically and the admin sees the change on the dashboard instantly.

---

## AI Pipeline

Every WhatsApp message goes through this pipeline. First it is filtered — bot messages, replies, and short messages are removed. Then it is cleaned — emojis, URLs, and formatting are stripped. Then GPT-4o-mini classifies if the message is a task. If it is a task, the assigned person, deadline, and urgency are extracted. The task is saved to Sanity with full metadata. Rate limiting ensures maximum 50 AI calls per hour per organisation.

---

## Security

- Passwords hashed with bcrypt 12 rounds
- Email verification required before login
- JWT sessions with organisation ID encoded
- Route protection via NextAuth middleware
- Rate limiting on AI pipeline
- Duplicate message prevention
- CRON_SECRET protects scheduler endpoint
- Environment variables never committed to git

---

## Acknowledgments

This project was originally developed as part of my software engineering internship at **Luneox**.

---

## License

Private — All rights reserved MindMe 2026
