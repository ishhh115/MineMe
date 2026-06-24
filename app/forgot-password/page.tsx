"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [mode, setMode] = useState<"email" | "phone">("email")
const [identifier, setIdentifier] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
  mode === "email"
    ? { email: identifier }
    : { phone: identifier }
),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to send reset email")
        setLoading(false)
        return
      }

      setMessage(data.message || "Reset email sent")
      router.push(
  `/reset-password?identifier=${encodeURIComponent(identifier)}`
)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-muted p-6 md:p-10">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Forgot your password?</CardTitle>
            <CardDescription>
  Reset your password using either your email or WhatsApp number.
</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <div className="flex gap-2">
  <Button
    type="button"
    variant={mode === "email" ? "default" : "outline"}
    onClick={() => setMode("email")}
    className="flex-1"
  >
    Email
  </Button>

  <Button
    type="button"
    variant={mode === "phone" ? "default" : "outline"}
    onClick={() => setMode("phone")}
    className="flex-1"
  >
    WhatsApp
  </Button>
</div>

<Field>
  <FieldLabel htmlFor="identifier">
    {mode === "email" ? "Email" : "WhatsApp Number"}
  </FieldLabel>

  <Input
    id="identifier"
    type={mode === "email" ? "email" : "tel"}
    value={identifier}
    onChange={(e) => setIdentifier(e.target.value)}
    placeholder={
      mode === "email"
        ? "you@example.com"
        : "+919121834024"
    }
    required
  />

  <FieldDescription>
    {mode === "email"
      ? "We will send the reset code to this email."
      : "We will send the reset code via WhatsApp."}
  </FieldDescription>
</Field>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {message && <p className="text-sm text-emerald-400 text-center">{message}</p>}
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading
  ? "Sending..."
  : `Send reset ${mode === "email" ? "email" : "WhatsApp"} OTP`}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}