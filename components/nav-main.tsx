"use client"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ReactNode
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {
  const pathname = usePathname()

  return (
    <SidebarGroup className="px-2 py-3">
      <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.22em] text-sidebar-foreground/45">
        Navigation
      </SidebarGroupLabel>
      <SidebarMenu className="mt-1 gap-1.5">
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.url}
              tooltip={item.title}
              className="h-10 rounded-xl border border-transparent px-3 text-sidebar-foreground/85 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-400/25 hover:bg-emerald-500/10 hover:text-white data-[active=true]:border-emerald-400/35 data-[active=true]:bg-gradient-to-r data-[active=true]:from-emerald-500/30 data-[active=true]:to-transparent data-[active=true]:text-white data-[active=true]:shadow-[0_0_28px_rgba(16,185,129,0.28)] [&_svg]:transition-transform [&_svg]:duration-300 hover:[&_svg]:scale-110"
            >
              <Link href={item.url}>
                {item.icon}
                <span className="ml-2 transition-all duration-200 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:pointer-events-none">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}