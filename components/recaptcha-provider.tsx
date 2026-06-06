"use client"

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3"

export function RecaptchaProvider({
  children,
}: {
  children: React.ReactNode
}) {

  console.log(
    "RECAPTCHA KEY:",
    process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  )

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!
      }
    >
      {children}
    </GoogleReCaptchaProvider>
  )
}