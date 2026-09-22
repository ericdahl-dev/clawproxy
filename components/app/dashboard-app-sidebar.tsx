'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useSignOut } from '@/app/dashboard/use-sign-out';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { Activity, LayoutDashboard, Network, Route } from 'lucide-react';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/nodes', label: 'Nodes', icon: Network },
  { href: '/dashboard/routes', label: 'Routes', icon: Route },
  { href: '/dashboard/events', label: 'Events', icon: Activity },
] as const;

function emailInitials(email: string) {
  const local = email.split('@')[0] ?? '?';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase() || '?';
}

type DashboardAppSidebarProps = {
  userEmail: string;
};

export function DashboardAppSidebar({ userEmail }: DashboardAppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, busy, error } = useSignOut();

  return (
    <Sidebar collapsible="icon" variant="inset" className="[&_[data-sidebar=sidebar-inner]]:border [&_[data-sidebar=sidebar-inner]]:border-sidebar-border/80 [&_[data-sidebar=sidebar-inner]]:bg-sidebar/85 [&_[data-sidebar=sidebar-inner]]:shadow-2xl [&_[data-sidebar=sidebar-inner]]:shadow-black/25 [&_[data-sidebar=sidebar-inner]]:backdrop-blur-xl">
      <SidebarHeader className="border-sidebar-border/80 border-b p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="rounded-2xl hover:bg-sidebar-accent/70 data-active:bg-sidebar-accent/70">
              <Link href="/dashboard">
                <span className="flex size-9 items-center justify-center rounded-2xl border border-sidebar-primary/30 bg-sidebar-primary/15 font-mono text-sm font-semibold text-sidebar-primary shadow-lg shadow-black/20">
                  cp
                </span>
                <span className="truncate font-mono text-[0.78rem] font-semibold uppercase tracking-[0.2em] text-sidebar-primary">
                  clawproxy
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="px-1 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-sidebar-foreground/55">
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {navigation.map((item) => {
                const isActive =
                  item.href === '/dashboard'
                    ? pathname === '/dashboard'
                    : pathname.startsWith(item.href);
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                      className="rounded-2xl text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground data-active:border data-active:border-sidebar-primary/25 data-active:bg-sidebar-primary/12 data-active:text-sidebar-primary data-active:shadow-lg data-active:shadow-black/15"
                    >
                      <Link href={item.href}>
                        <Icon className="stroke-[1.75]" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-sidebar-border/80 border-t p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="rounded-2xl border border-sidebar-border/70 bg-background/25 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="size-8 rounded-lg">
                    <AvatarFallback className="rounded-lg bg-sidebar-primary/15 font-mono text-xs text-sidebar-primary">
                      {emailInitials(userEmail)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{userEmail}</span>
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="size-8 rounded-lg">
                      <AvatarFallback className="rounded-lg text-xs">
                        {emailInitials(userEmail)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{userEmail}</span>
                      </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => router.push('/')}>Back to site</DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={busy}
                  onSelect={(e) => {
                    e.preventDefault();
                    void signOut();
                  }}
                >
                  {busy ? 'Signing out…' : 'Sign out'}
                </DropdownMenuItem>
                {error ? (
                  <p className="text-destructive px-2 py-1.5 text-xs">{error}</p>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
