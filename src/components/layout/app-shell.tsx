"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Briefcase,
  LayoutDashboard,
  LogOut,
  Menu,
  Mic,
  Route,
  Sparkles,
  User,
  FileText,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { SidebarAdSlot } from "@/components/ads/sidebar-ad-slot";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Command Center", icon: LayoutDashboard },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/cv-builder", label: "CV Builder", icon: Briefcase },
  { href: "/cover-letter", label: "Cover Letter", icon: FileText },
  { href: "/optimize", label: "Job Matcher", icon: Sparkles },
  { href: "/jobs", label: "Jobs", icon: Sparkles },
  { href: "/?interview=1", label: "Interview Prep", icon: Mic },
  { href: "/skills-roadmap", label: "Skill Roadmap", icon: Route },
];

function NavLinks({ pathname }: { pathname: string }) {
  const searchParams = useSearchParams();

  return (
    <nav className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon }) => {
        let active: boolean;
        if (href.startsWith("/?")) {
          // Query-based route: match pathname "/" AND the query param
          const [, query] = href.split("?");
          const [key, val] = query.split("=");
          active = pathname === "/" && searchParams.get(key) === val;
        } else if (href === "/") {
          active = pathname === "/" && !searchParams.get("interview");
        } else {
          active = pathname === href || pathname.startsWith(`${href}/`);
        }
        return (
          <Link
            key={href + label}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-slate-200 text-slate-900 dark:bg-white/10 dark:text-white"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-100",
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden w-60 shrink-0 flex-col border-r border-[var(--border-color)] bg-[var(--sidebar-bg)] lg:flex">
          <div className="border-b border-[var(--border-color)] px-5 py-6">
            <Link href="/" className="font-semibold tracking-tight text-slate-900 dark:text-white">
              Live Job Match
            </Link>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">Executive Tech workspace</p>
          </div>
          <ScrollArea className="flex-1 px-3 py-4">
            <NavLinks pathname={pathname} />
          </ScrollArea>
          <div className="p-4">
            <SidebarAdSlot />
          </div>
          <div className="border-t border-[var(--border-color)] px-4 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400 dark:text-zinc-500">Theme</p>
              <ThemeToggle />
            </div>
            {status === "authenticated" ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800 dark:text-zinc-200">
                    {session?.user?.name ?? session?.user?.email ?? "Account"}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-zinc-500">
                    {session?.user?.email}
                  </p>
                </div>
                <Button asChild variant="ghost" size="icon" aria-label="Sign out">
                  <Link href="/sign-out">
                    <LogOut className="h-4 w-4 text-slate-400 dark:text-zinc-400" />
                  </Link>
                </Button>
              </div>
            ) : (
              <Button asChild variant="ghost" size="sm" className="w-full">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-[var(--border-color)] bg-[var(--header-bg)] px-4 py-3 backdrop-blur lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <div className="mb-6">
                  <p className="font-semibold text-white">Live Job Match</p>
                  <p className="text-xs text-zinc-500">Navigation</p>
                </div>
                <NavLinks pathname={pathname} />
                <div className="mt-auto pt-6">
                  <SidebarAdSlot />
                </div>
              </SheetContent>
            </Sheet>
            <span className="text-sm font-medium text-slate-800 dark:text-zinc-200">Mission control</span>
            <div className="ml-auto">
              {status === "authenticated" ? (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-out">Sign out</Link>
                </Button>
              ) : (
                <Button asChild variant="ghost" size="sm">
                  <Link href="/sign-in">Sign in</Link>
                </Button>
              )}
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">{children}</main>
        </div>
      </div>
    </TooltipProvider>
  );
}
