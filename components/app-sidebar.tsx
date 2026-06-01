"use client"

import * as React from "react"
import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import { useSession } from "next-auth/react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarSeparator,
  SidebarTrigger,
  SidebarRail,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar"
import {
  
  LayoutDashboardIcon,
  CheckSquareIcon,
  UsersIcon,
  BellIcon,
  Settings2Icon,
  MessageCircleIcon,
  
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [],
    },
    {
      title: "Tasks",
      url: "/tasks",
      icon: <CheckSquareIcon />,
      items: [],
    },
    {
      title: "Groups",
      url: "/groups",
      icon: <UsersIcon />,
      items: [],
    },
    {
      title: "Notifications",
      url: "/notifications",
      icon: <BellIcon />,
      items: [],
    },
    {
      title: "Settings",
      url: "/settings",
      icon: <Settings2Icon />,
      items: [],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session } = useSession()
  const currentUser = {
    name: session?.user?.name || "Guest User",
    email: session?.user?.email || "guest@local",
    avatar: session?.user?.image || "",
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="gap-3 border-b border-white/10 p-3">
        <div className="flex items-center justify-between">
          <div className="rounded-lg border border-white/10 bg-black/25 p-1">
            <SidebarTrigger className="text-sidebar-foreground/80 hover:bg-emerald-500/20 hover:text-white" />
          </div>
          <span className="rounded-full border border-emerald-300/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-100">
            Live
          </span>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="h-14 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10">
              <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-[0_0_24px_rgba(16,185,129,0.35)]">
                <MessageCircleIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:pointer-events-none">
                <span className="font-semibold tracking-tight">MineMe</span>
                <span className="text-xs text-sidebar-foreground/65">Task Manager</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {/* Workspace/team switching removed for MVP — simplified header */}
      </SidebarHeader>
      <SidebarContent className="pt-1">
        <SidebarSeparator className="mx-3 mb-2" />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter className="border-t border-white/10 p-3">
        <NavUser user={currentUser} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}