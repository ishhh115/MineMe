"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(() => {
    const queryEmail = searchParams.get("email") || ""
    if (queryEmail) return queryEmail

    if (typeof window === "undefined") return ""

    const pending = sessionStorage.getItem("pending-verification")
    if (!pending) return ""

    try {
      const parsed = JSON.parse(pending) as { email?: string }
      return parsed.email || ""
    } catch {
      return ""
    }
  })
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!email || !code) {
      setError("Email and OTP are required")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Verification failed")
        setLoading(false)
        return
      }

      setSuccess("Email verified successfully. Signing you in...")

      const pending = sessionStorage.getItem("pending-verification")
      let password = ""
      let phone = ""

      if (pending) {
        try {
          const parsed = JSON.parse(pending) as { password?: string; phone?: string }
          password = parsed.password || ""
          phone = parsed.phone || ""
        } catch {
          // ignore malformed pending state
        }
      }

      if (!password) {
        router.replace("/login?verified=1")
        return
      }

      const credentials = phone
        ? { phone, password }
        : { email, password }

      const result = await signIn("credentials", {
        ...credentials,
        password,
        redirect: false,
      })

      sessionStorage.removeItem("pending-verification")

      if (result?.error) {
        router.replace("/login?verified=1")
        return
      }

      router.replace("/onboarding")
      router.refresh()
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
            <CardTitle>Verify your email</CardTitle>
            <CardDescription>
              Enter the 6-digit OTP we sent to {email || "your email"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="code">6-digit OTP</FieldLabel>
                  <Input
                    id="code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                  />
                  <FieldDescription>
                    The code expires 15 minutes after signup.
                  </FieldDescription>
                </Field>
                {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                {success && <p className="text-sm text-emerald-400 text-center">{success}</p>}
                <Field>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Verifying..." : "Verify and continue"}
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