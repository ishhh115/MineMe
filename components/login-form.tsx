"use client"

import { useRef, useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [mode, setMode] = useState<"phone" | "email">("phone")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const phoneInputRef = useRef<HTMLInputElement | null>(null)
  const emailInputRef = useRef<HTMLInputElement | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const identifier = mode === "phone" ? phone : email
    const loginCredentials = mode === "phone" ? { phone, password } : { email, password }
    if (!identifier) {
      setError(mode === "phone" ? "Please enter WhatsApp number" : "Please enter email")
      setLoading(false)
      return
    }

    try {
      const checkRes = await fetch("/api/auth/check-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mode === "phone" ? phone : undefined, email: mode === "email" ? email : undefined }),
      })
      const checkData = await checkRes.json()
      if (checkRes.ok && !checkData.exists) {
        setError("User not registered. Please sign up first.")
        setLoading(false)
        return
      }
      if (checkRes.ok && checkData.exists && !checkData.verified) {
        setError("Please verify your email before logging in.")
        setLoading(false)
        return
      }
    } catch {
      // continue to signIn and rely on credentials validation if precheck fails
    }

    const result = await signIn("credentials", {
      ...loginCredentials,
      password,
      redirect: false,
      callbackUrl: "/dashboard",
    })

    if (result?.error) {
      setError("Incorrect password or invalid credentials")
      setLoading(false)
    } else {
      if (result?.url) {
        router.replace(result.url)
      } else {
        router.replace("/dashboard")
      }
      router.refresh()
    }
  }

  const handleGoogleLogin = () => {
    signIn("google", { callbackUrl: "/dashboard" })
  }

  const handleEmailLogin = () => {
    setMode("email")
    setError("")
    emailInputRef.current?.focus()
  }

  const handlePhoneLogin = () => {
    setMode("phone")
    setError("")
    phoneInputRef.current?.focus()
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            Login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              <Field>
                <Button variant="outline" type="button" onClick={handlePhoneLogin}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M20.64 12.2c0-.64-.06-1.25-.17-1.84H12v3.48h4.77a4.08 4.08 0 0 1-1.77 2.68v2.23h2.86c1.67-1.54 2.78-3.83 2.78-6.55Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 21c2.43 0 4.47-.8 5.96-2.2l-2.86-2.23c-.8.54-1.82.86-3.1.86-2.38 0-4.4-1.6-5.12-3.77H3.93v2.36A9 9 0 0 0 12 21Z"
                      fill="currentColor"
                    />
                    <path
                      d="M6.88 13.66A5.4 5.4 0 0 1 6.6 12c0-.58.1-1.14.28-1.66V8H3.93A9 9 0 0 0 3 12c0 1.44.35 2.8.93 4l2.95-2.34Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 5.38c1.32 0 2.5.45 3.42 1.33l2.57-2.57A8.7 8.7 0 0 0 12 3a9 9 0 0 0-8.07 5l2.95 2.34C7.6 7.03 9.62 5.38 12 5.38Z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with WhatsApp
                </Button>
                <Button variant="outline" type="button" onClick={handleEmailLogin}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M4 4h16v16H4z" fill="none" />
                    <path d="M4 6l8 6 8-6" fill="currentColor" />
                    <path d="M4 8v10h16V8l-8 6z" fill="currentColor" opacity="0.55" />
                  </svg>
                  Login with Email
                </Button>
                <Button variant="outline" type="button" onClick={handleGoogleLogin}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Login with Google
                </Button>
              </Field>
              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                Or continue with
              </FieldSeparator>
              {mode === "phone" ? (
                <Field>
                  <FieldLabel htmlFor="phone">WhatsApp Number</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 00000 00000"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    ref={phoneInputRef}
                  />
                </Field>
              ) : (
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    ref={emailInputRef}
                  />
                </Field>
              )}
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Password</FieldLabel>
                  <a href="/forgot-password" className="ml-auto text-sm underline-offset-4 hover:underline">
                    Forgot your password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </Field>
              {error && (
                <p className="text-sm text-red-400 text-center">{error}</p>
              )}
              <Field>
                <Button type="submit" disabled={loading}>
                  {loading ? "Logging in..." : "Login"}
                </Button>
                <FieldDescription className="text-center">
                  Don&apos;t have an account? <a href="/signup">Sign up</a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </div>
  )
}