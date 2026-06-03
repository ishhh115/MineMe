export async function verifyRecaptcha(token: string) {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY

  if (!secretKey) {
    throw new Error("RECAPTCHA_SECRET_KEY is not configured")
  }

  const response = await fetch(
    "https://www.google.com/recaptcha/api/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    }
  )

  const data = await response.json()

  return data.success === true && (data.score ?? 0) >= 0.5
}