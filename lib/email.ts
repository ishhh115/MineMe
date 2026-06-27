// Helper function to send emails via AWS SES
export async function sendEmail({
  to,
  subject,
  htmlBody,
}: {
  to: string
  subject: string
  htmlBody: string
}) {
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/send-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, htmlBody }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || "Failed to send email")
    }

    return { success: true, messageId: data.messageId }
  } catch (error) {
   
    return { success: false, error }
  }
}

// Task reminder email template
export function taskReminderTemplate({
  taskText,
  assignedTo,
  deadline,
  groupName,
  urgency,
}: {
  taskText: string
  assignedTo: string
  deadline: string
  groupName: string
  urgency: string
}) {
  const urgencyColor = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#10b981",
  }[urgency] || "#10b981"

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0f0a;font-family:sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1a2e1a;border-radius:16px;overflow:hidden;">
          
          <div style="background:linear-gradient(135deg,#0d2010,#0a0f0a);padding:32px 32px 24px;border-bottom:1px solid #1a2e1a;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:32px;height:32px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:black;font-size:16px;">💬</span>
              </div>
              <span style="color:#10b981;font-weight:600;font-size:14px;">MindMe</span>
            </div>
            <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Task Reminder</h1>
            <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">You have a task that needs attention</p>
          </div>

          <div style="padding:24px 32px;">
            <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:12px;padding:20px;margin-bottom:20px;">
              <p style="margin:0 0 12px;color:#9ca3af;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.1em;">Task</p>
              <p style="margin:0;color:white;font-size:16px;font-weight:600;">${taskText}</p>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
              <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:10px;padding:14px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">Assigned To</p>
                <p style="margin:0;color:white;font-size:13px;font-weight:600;">${assignedTo || "Unassigned"}</p>
              </div>
              <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:10px;padding:14px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">Group</p>
                <p style="margin:0;color:white;font-size:13px;font-weight:600;">${groupName}</p>
              </div>
              <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:10px;padding:14px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">Deadline</p>
                <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;">${deadline}</p>
              </div>
              <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:10px;padding:14px;">
                <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">Priority</p>
                <p style="margin:0;font-size:13px;font-weight:600;color:${urgencyColor};text-transform:capitalize;">${urgency}</p>
              </div>
            </div>

            <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
              This reminder was sent automatically by MindMe
            </p>
          </div>

        </div>
      </body>
    </html>
  `
}

export function verificationCodeTemplate({
  name,
  verificationCode,
}: {
  name: string
  verificationCode: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0f0a;font-family:sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1a2e1a;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0d2010,#0a0f0a);padding:32px 32px 24px;border-bottom:1px solid #1a2e1a;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:32px;height:32px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:black;font-size:16px;">💬</span>
              </div>
              <span style="color:#10b981;font-weight:600;font-size:14px;">MindMe</span>
            </div>
            <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Verify your account</h1>
            <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Use the one-time code below to finish signing up.</p>
          </div>

          <div style="padding:24px 32px;">
            <p style="margin:0 0 16px;color:#d1d5db;font-size:14px;">Hi ${name},</p>
            <p style="margin:0 0 20px;color:#9ca3af;font-size:13px;line-height:1.6;">
              Enter this 6-digit verification code on the signup verification page. It expires in 15 minutes.
            </p>

            <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:14px;padding:22px;text-align:center;margin-bottom:20px;">
              <div style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">Verification Code</div>
              <div style="color:#10b981;font-size:34px;font-weight:800;letter-spacing:0.28em;">${verificationCode}</div>
            </div>

            <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
              If you did not request this, you can ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}

export function passwordResetTemplate({
  name,
  resetCode,
  resetLink,
}: {
  name: string
  resetCode: string
  resetLink: string
}) {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin:0;padding:0;background:#0a0f0a;font-family:sans-serif;">
        <div style="max-width:560px;margin:40px auto;background:#111;border:1px solid #1a2e1a;border-radius:16px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#0d2010,#0a0f0a);padding:32px 32px 24px;border-bottom:1px solid #1a2e1a;">
            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
              <div style="width:32px;height:32px;background:#10b981;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                <span style="color:black;font-size:16px;">💬</span>
              </div>
              <span style="color:#10b981;font-weight:600;font-size:14px;">MindMe</span>
            </div>
            <h1 style="margin:0;color:white;font-size:22px;font-weight:700;">Reset your password</h1>
            <p style="margin:8px 0 0;color:#6b7280;font-size:13px;">Use the code below or the reset link to create a new password.</p>
          </div>

          <div style="padding:24px 32px;">
            <p style="margin:0 0 16px;color:#d1d5db;font-size:14px;">Hi ${name},</p>
            <p style="margin:0 0 20px;color:#9ca3af;font-size:13px;line-height:1.6;">
              We received a request to reset your password. This code expires in 15 minutes.
            </p>

            <div style="background:#0d1a0d;border:1px solid #1a2e1a;border-radius:14px;padding:22px;text-align:center;margin-bottom:20px;">
              <div style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px;">Reset Code</div>
              <div style="color:#10b981;font-size:34px;font-weight:800;letter-spacing:0.28em;">${resetCode}</div>
            </div>

            <div style="text-align:center;margin-bottom:20px;">
              <a href="${resetLink}" style="display:inline-block;background:#10b981;color:black;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">
                Reset password
              </a>
            </div>

            <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;word-break:break-all;">
              If the button does not work, open: ${resetLink}
            </p>
          </div>
        </div>
      </body>
    </html>
  `
}