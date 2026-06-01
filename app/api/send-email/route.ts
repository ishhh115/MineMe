import { NextResponse } from "next/server";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Initialize client without keys. 
// It automatically inherits credentials from the AWS Instance Profile / ECS Task Role.
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
});

interface EmailRequest {
  to: string;
  subject: string;
  htmlBody: string;
}

export async function POST(request: Request) {
  try {
    const { to, subject, htmlBody }: Partial<EmailRequest> = await request.json();

    if (!to || !subject || !htmlBody) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const fromEmail = process.env.AWS_FROM_EMAIL;
    if (!fromEmail) {
      return NextResponse.json({ error: "Server missing AWS_FROM_EMAIL config" }, { status: 500 });
    }

    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: "UTF-8" },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    });

    const response = await sesClient.send(command);
    return NextResponse.json({ success: true, messageId: response.MessageId });

  } catch (error: any) {
    console.error("IAM Role SES Error:", error);
    return NextResponse.json({ error: error.message || "Failed to send" }, { status: 500 });
  }
}