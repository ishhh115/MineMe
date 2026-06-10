"use client"

import Link from "next/link"
import { MessageCircleIcon, CheckSquareIcon, BellIcon, UsersIcon, ArrowRightIcon, ZapIcon, ShieldCheckIcon, TrendingUpIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const features = [
  {
    icon: ZapIcon,
    title: "Auto Task Extraction",
    description: "Automatically reads messages and detects action items without manual input.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
  {
    icon: BellIcon,
    title: "Smart Deadline Reminders",
    description: "Get notified before deadlines are missed. Reminders sent directly to WhatsApp or email.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: UsersIcon,
    title: "Multi Group Monitoring",
    description: "Monitor multiple WhatsApp groups simultaneously. All tasks in one place.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: ShieldCheckIcon,
    title: "Secure & Private",
    description: "Your conversations are processed securely. Credentials are never stored directly.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: TrendingUpIcon,
    title: "Team Productivity",
    description: "Track completion rates, task throughput, and group activity in real time.",
    color: "text-coral-400",
    bg: "bg-red-400/10",
  },
  {
    icon: CheckSquareIcon,
    title: "Zero Manual Work",
    description: "No copy pasting. No reminders set manually. Everything happens automatically.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
]

const steps = [
  {
    number: "01",
    title: "Connect Your WhatsApp Group",
    description: "Add the bot number to your WhatsApp group. It sits silently and listens to all conversations.",
    icon: MessageCircleIcon,
  },
  {
    number: "02",
    title: "System Extracts Tasks Automatically",
    description: "Every message is analyzed; action items, deadlines, and assignees are detected and saved.",
    icon: ZapIcon,
  },
  {
    number: "03",
    title: "Get Smart Reminders",
    description: "Before any deadline approaches, you get a reminder directly in WhatsApp or email. Nothing slips through.",
    icon: BellIcon,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-400/10">
              <MessageCircleIcon className="size-5 text-emerald-400" />
            </div>
            <span className="font-semibold text-base">MindMe</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-black font-medium gap-1.5">
                Get Started
                <ArrowRightIcon className="size-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 pb-16 px-6">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-4">
          <Badge variant="outline" className="border-emerald-400/30 text-emerald-400 bg-emerald-400/5 px-4 py-1.5 text-xs font-medium">
            WhatsApp Workflow Automation
          </Badge>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight">
            Turn WhatsApp Conversations
            <br />
            <span className="text-emerald-400">Into Actionable Tasks</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
            Stop losing important action items in long group chats. Our system automatically extracts tasks, assigns them to the right people, and sends smart deadline reminders — all without manual work.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <Link href="/signup">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2 px-8">
                Start for Free
                <ArrowRightIcon className="size-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="border-border/50 gap-2 px-8">
                Login
              </Button>
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">No credit card required · Free to get started</p>

          {/* Hero Visual */}
          <div className="w-full max-w-3xl mt-6 rounded-2xl border border-border/40 bg-card overflow-hidden relative">
            {/* subtle pulse to add life */}
            <div className="absolute top-3 right-3 pointer-events-none">
              <span className="inline-flex h-3 w-3 rounded-full bg-emerald-400/80 animate-ping opacity-60" />
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-sm -mt-3 ml-1" />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/30 bg-muted/30">
              <div className="size-3 rounded-full bg-red-400/60" />
              <div className="size-3 rounded-full bg-yellow-400/60" />
              <div className="size-3 rounded-full bg-emerald-400/60" />
              <span className="text-xs text-muted-foreground ml-2">MindMe — Dashboard</span>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Total Tasks", value: "24", color: "text-emerald-400" },
                { label: "Pending", value: "12", color: "text-yellow-400" },
                { label: "Urgent", value: "4", color: "text-red-400" },
                { label: "Groups", value: "3", color: "text-blue-400" },
              ].map((stat) => (
                <div key={stat.label} className="p-3 rounded-xl bg-muted/50 border border-border/30 flex flex-col gap-1">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>
            <div className="px-4 pb-4 flex flex-col gap-2 max-h-56 overflow-y-auto">
              {[
                { task: "Submit Q3 report", group: "Work Group", urgency: "High", color: "text-red-400 bg-red-400/10 border-red-400/20", time: "2m" },
                { task: "Call the client", group: "Sales Team", urgency: "Medium", color: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20", time: "18m" },
                { task: "Review proposal", group: "Work Group", urgency: "Low", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", time: "1h" },
                { task: "Send invoice follow-up", group: "Finance", urgency: "High", color: "text-red-400 bg-red-400/10 border-red-400/20", time: "3h" },
                { task: "Ops handover checklist", group: "Operations", urgency: "Low", color: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20", time: "5h" },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">{item.group.slice(0,1)}</div>
                      <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-black/40" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.task}</p>
                      <p className="text-xs text-slate-300">{item.group} · {item.time} ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.color}`}>{item.urgency}</span>
                    <div className="h-2 w-2 rounded-full bg-emerald-400 shadow-sm" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400 mb-3">How it Works</p>
            <h2 className="text-3xl font-bold tracking-tight">Three steps to never miss a task again</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col gap-4 relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-px bg-border/30 -translate-x-8 z-0" />
                )}
                <div className="flex items-center gap-3">
                  <div className="size-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center shrink-0">
                    <step.icon className="size-5 text-emerald-400" />
                  </div>
                  <span className="text-3xl font-bold text-emerald-400/20">{step.number}</span>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-base font-semibold">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-6 border-t border-border/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-medium uppercase tracking-widest text-emerald-400 mb-3">Features</p>
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to stay on top of tasks</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
            {features.map((feature) => {
              const isCore = feature.title === "Auto Task Extraction" || feature.title === "Smart Deadline Reminders"
              return (
                <div
                  key={feature.title}
                  className={`rounded-xl border border-border/30 bg-card hover:border-border/60 transition-colors flex flex-col gap-3 ${isCore ? "scale-[1.03] ring-1 ring-emerald-400/8 bg-muted/40" : ""}`}
                  style={{ padding: "1.25rem" , minHeight: isCore ? 140 : undefined }}
                >
                  <div className={`size-10 rounded-lg ${feature.bg} flex items-center justify-center`}>
                    <feature.icon className={`size-5 ${feature.color}`} />
                  </div>
                  <div className="flex flex-col gap-2">
                    {isCore && (
                      <span className="inline-block text-[11px] font-semibold text-emerald-200 bg-emerald-500/8 px-2 py-0.5 rounded-full w-max">Core Feature</span>
                    )}
                    <h3 className={`text-sm font-semibold ${isCore ? "text-base" : ""}`}>{feature.title}</h3>
                    <p className={`${isCore ? "text-sm text-slate-300 leading-6" : "text-xs text-muted-foreground leading-5"}`}>{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 border-t border-border/20">
        <div className="max-w-2xl mx-auto text-center flex flex-col items-center gap-4">
          <div className="p-4 rounded-2xl bg-emerald-400/10">
            <MessageCircleIcon className="size-10 text-emerald-400" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Stop Losing Tasks in WhatsApp Conversations</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">Bring structure to group chat chaos — extract tasks automatically and get timely reminders so nothing slips through.</p>
          <Link href="/signup">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold gap-2 px-10">
              Stop Losing Tasks — Get Started
              <ArrowRightIcon className="size-4" />
            </Button>
          </Link>
          <p className="text-xs text-muted-foreground">No credit card required · Setup in under 5 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/20 py-8 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-400/10 mt-1">
              <MessageCircleIcon className="size-4 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm font-medium">MindMe</div>
              <div className="text-xs text-muted-foreground">Built for teams who live in WhatsApp</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Product</span>
            <Link href="/features" className="text-xs text-muted-foreground hover:text-foreground">Features</Link>
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground">Pricing</Link>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold">Company</span>
            <Link href="/privacy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
            <span className="text-sm font-semibold mt-3">Connect</span>
            <a href="mailto:hello@example.com" className="text-xs text-muted-foreground hover:text-foreground">Contact</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  )
}