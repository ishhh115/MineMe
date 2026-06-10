"use client"

import { useMemo, useState } from "react"
import { MessageCircleIcon, CheckCircleIcon, BellIcon, UsersIcon, ArrowRightIcon, ArrowLeftIcon, ShieldCheckIcon, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

const steps = [
  { id: 1, title: "Welcome", subtitle: "Quick intro", icon: MessageCircleIcon },
  { id: 2, title: "Add Groups", subtitle: "Choose conversations to monitor", icon: UsersIcon },
  { id: 3, title: "Notifications", subtitle: "How you want reminders", icon: BellIcon },
  { id: 4, title: "All Done", subtitle: "Start monitoring", icon: CheckCircleIcon },
]

const initialGroups = [
  { id: 1, name: "Work Group", participants: 12 },
  { id: 2, name: "Sales Team", participants: 8 },
  { id: 3, name: "Finance", participants: 5 },
  { id: 4, name: "Personal", participants: 3 },
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedGroups, setSelectedGroups] = useState<number[]>([1, 2])
  const [groupQuery, setGroupQuery] = useState("")
  const [notifications, setNotifications] = useState({ whatsapp: true, email: true, urgentOnly: false })
  const [emailSkipped, setEmailSkipped] = useState(false)

  const filteredGroups = useMemo(() => {
    const q = groupQuery.trim().toLowerCase()
    return initialGroups.filter((g) => !q || g.name.toLowerCase().includes(q))
  }, [groupQuery])

  const toggleGroup = (id: number) => {
    setSelectedGroups((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]))
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    if (key === "email") setEmailSkipped(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="flex items-center gap-2 mb-8">
        <div className="p-2 rounded-xl bg-emerald-400/10">
          <MessageCircleIcon className="size-6 text-emerald-400" />
        </div>
        <span className="text-lg font-semibold">MindMe</span>
      </div>

      <div className="w-full max-w-2xl mb-8">
        <div className="flex items-center justify-between mb-3">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2">
                <div className={`size-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  currentStep > step.id ? "bg-emerald-400 border-emerald-400" : currentStep === step.id ? "border-emerald-400 bg-emerald-400/10" : "border-border bg-muted"
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="size-4 text-black" />
                  ) : (
                    <step.icon className={`size-4 ${currentStep === step.id ? "text-emerald-400" : "text-muted-foreground"}`} />
                  )}
                </div>
                <div className="text-center">
                  <div className={`text-xs hidden sm:block ${currentStep === step.id ? "text-emerald-400 font-medium" : "text-muted-foreground"}`}>{step.title}</div>
                  <div className="text-2xs hidden sm:block text-muted-foreground mt-0.5">{step.subtitle}</div>
                </div>
              </div>
              {index < steps.length - 1 && <div className={`flex-1 h-0.5 mx-3 mb-5 transition-all ${currentStep > step.id ? "bg-emerald-400" : "bg-border"}`} />}
            </div>
          ))}
        </div>
      </div>

      <Card className="w-full max-w-2xl border-border/40">
        <CardContent className="p-8">
          {currentStep === 1 && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="p-5 rounded-2xl bg-emerald-400/10">
                <MessageCircleIcon className="size-12 text-emerald-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Welcome to MindMe</h1>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-md">Automatically extracts tasks from WhatsApp conversations and sends deadline reminders.</p>
              </div>

              <div className="flex items-center gap-3 mt-2">
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
                  <MessageCircleIcon className="size-4 text-emerald-400" />
                  <span className="text-sm">WhatsApp messages</span>
                </div>
                <div className="text-muted-foreground">↓</div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
                  <ShieldCheck className="size-4 text-emerald-400" />
                  <span className="text-sm">Task extraction</span>
                </div>
                <div className="text-muted-foreground">↓</div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-muted/30 border border-border/30">
                  <BellIcon className="size-4 text-emerald-400" />
                  <span className="text-sm">Smart reminders</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-4">
                {[{ icon: MessageCircleIcon, title: "Auto Extract", desc: "Tasks from conversations" }, { icon: BellIcon, title: "Smart Alerts", desc: "Deadline reminders" }, { icon: UsersIcon, title: "Group Monitor", desc: "Multiple groups" }].map((feature) => (
                  <div key={feature.title} className="flex flex-col items-center gap-2 p-4 rounded-xl bg-muted/50 border border-border/30">
                    <feature.icon className="size-5 text-emerald-400" />
                    <p className="text-sm font-medium">{feature.title}</p>
                    <p className="text-xs text-muted-foreground">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Select Groups to Monitor</h2>
                <p className="text-sm text-muted-foreground">Choose which WhatsApp groups the bot should listen to</p>
              </div>

              <div className="flex items-center gap-3">
                <Input placeholder="Search groups..." value={groupQuery} onChange={(e) => setGroupQuery(e.target.value)} className="flex-1" />
              </div>

              <div className="flex flex-col gap-3">
                {filteredGroups.map((group) => (
                  <div key={group.id} onClick={() => toggleGroup(group.id)} className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${selectedGroups.includes(group.id) ? "border-emerald-400/40 bg-emerald-400/5" : "border-border/40 hover:border-border/70"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${selectedGroups.includes(group.id) ? "bg-emerald-400/10" : "bg-muted"}`}>
                        <MessageCircleIcon className={`size-4 ${selectedGroups.includes(group.id) ? "text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{group.name}</p>
                        <p className="text-xs text-muted-foreground">{group.participants} participants</p>
                      </div>
                    </div>
                    <div className={`size-5 rounded-full border-2 flex items-center justify-center ${selectedGroups.includes(group.id) ? "border-emerald-400 bg-emerald-400" : "border-border"}`}>{selectedGroups.includes(group.id) && <CheckCircleIcon className="size-3 text-black" />}</div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{selectedGroups.length} groups selected</p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold tracking-tight">Notification Preferences</h2>
                <p className="text-sm text-muted-foreground">Choose how you want to receive deadline reminders</p>
              </div>
              <div className="flex flex-col gap-3">
                {[{ key: "whatsapp", icon: MessageCircleIcon, title: "WhatsApp Reminders", desc: "Send reminders back to the WhatsApp group" }, { key: "email", icon: BellIcon, title: "Email Reminders", desc: "Send reminders to your registered email" }, { key: "urgentOnly", icon: ShieldCheckIcon, title: "Only send reminders for high priority tasks", desc: "Reduce noise — only important tasks" }].map((pref) => (
                  <div key={pref.key} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${notifications[pref.key as keyof typeof notifications] ? "border-emerald-400/40 bg-emerald-400/5" : "border-border/40 hover:border-border/70"}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${notifications[pref.key as keyof typeof notifications] ? "bg-emerald-400/10" : "bg-muted"}`}>
                        <pref.icon className={`size-4 ${notifications[pref.key as keyof typeof notifications] ? "text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pref.title}</p>
                        <p className="text-xs text-muted-foreground">{pref.desc}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {pref.key === "email" && (
                        <button onClick={() => { setNotifications((p) => ({ ...p, email: false })); setEmailSkipped(true); }} className="text-xs text-muted-foreground mr-2">Skip for now</button>
                      )}
                      <div onClick={() => toggleNotification(pref.key as keyof typeof notifications)} className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${notifications[pref.key as keyof typeof notifications] ? "bg-emerald-400" : "bg-muted border border-border"}`}>
                        <div className={`absolute top-1 size-4 rounded-full bg-white transition-all ${notifications[pref.key as keyof typeof notifications] ? "left-6" : "left-1"}`} />
                      </div>
                    </div>
                  </div>
                ))}
                {emailSkipped && <p className="text-xs text-muted-foreground">You can add email reminders later in Settings.</p>}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="flex flex-col items-center text-center gap-6">
              <div className="p-5 rounded-2xl bg-emerald-400/10">
                <CheckCircleIcon className="size-12 text-emerald-400" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-bold tracking-tight">You are all set</h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-md">Your MindMe workspace is ready. It will now monitor your selected groups, extract tasks automatically, and send you smart reminders before deadlines.</p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                {[`Bot configured`, `${selectedGroups.length} groups being monitored`, "Task extraction active", "Deadline reminders configured"].map((item) => (
                  <div key={item} className="flex items-center gap-3 p-3 rounded-lg bg-emerald-400/5 border border-emerald-400/20">
                    <CheckCircleIcon className="size-4 text-emerald-400 shrink-0" />
                    <p className="text-sm text-left">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border/30">
            <Button variant="outline" onClick={() => setCurrentStep((prev) => prev - 1)} disabled={currentStep === 1} className="gap-2">
              <ArrowLeftIcon className="size-4" />
              Back
            </Button>
            <span className="text-xs text-muted-foreground">Step {currentStep} of {steps.length}</span>
            {currentStep < steps.length ? (
              <Button onClick={() => setCurrentStep((prev) => prev + 1)} className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium">
                Next
                <ArrowRightIcon className="size-4" />
              </Button>
            ) : (
              <Button className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-black font-medium w-48 py-3 text-lg" onClick={() => window.location.href = "/dashboard"}>
                Go to Dashboard
                <ArrowRightIcon className="size-4" />
              </Button>
            )}
          </div>

        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground mt-6">You can change these settings anytime from the Settings page</p>

    </div>
  )
}
