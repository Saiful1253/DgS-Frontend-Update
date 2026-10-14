 
"use client";

import * as React from "react";
import {
  LayoutDashboard,
  PanelsTopLeft,
  FolderKanban,
  Layers,
  Package,
  Code2,
  FileText,
  MessageSquare,
  Briefcase,
  Mail,
  BarChart3,
  Users,
  Settings,
  
  LogOut,
  X,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
  SidebarFooter,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/services/auth/auth.service";
import { Button } from "../ui/button";
import { useSiteConfig } from "@/context/SiteConfigContext";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type MenuItem = {
  title: string;
  url: string;
  href: string;
  icon: React.ElementType;
};

const adminCmsModules: MenuItem[] = [
  {
    title: "Dashboard",
    url: "/dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    
  },
  {
    title: "Hero Sections",
    url: "/hero",
    href: "/hero",
    icon: PanelsTopLeft,
    
  },
  {
    title: "Portfolio",
    url: "/portfolio",
    href: "/portfolio",
    icon: FolderKanban,
    
  },
  {
    title: "Services",
    url: "/services",
    href: "/services",
    icon: Layers,
    
  },
  {
    title: "Product",
    url: "/products",
    href: "/products",
    icon: Package,
    
  },
  {
    title: "Technologies",
    url: "/technologies",
    href: "/technologies",
    icon: Code2,
    
  },
  {
    title: "Blogs / Articles",
    url: "/blogs",
    href: "/blogs",
    icon: FileText,
    
  },
  {
    title: "Testimonials",
    url: "/testimonials",
    href: "/testimonials",
    icon: MessageSquare,
    
  },
  {
    title: "Careers/Jobs",
    url: "/careers",
    href: "/careers",
    icon: Briefcase,
    
  },
  {
    title: "Contact Leads & Inquiries Manager",
    url: "/leads",
    href: "/leads",
    icon: Mail,
    
  },
  {
    title: "Analytics",
    url: "/analytics",
    href: "/analytics",
    icon: BarChart3,
    
  },
  {
    title: "User & Role Management",
    url: "/users",
    href: "/users",
    icon: Users,
    
  },
  {
    title: "Settings",
    url: "/settings",
    href: "/settings/site-config",
    icon: Settings,
    
  },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile, isMobile, state } = useSidebar();
  const { user } = useAuth();
  const [mounted, setMounted] = React.useState(false);
  const siteConfig = useSiteConfig();

  const companyName = siteConfig?.company_name || "Milanova Technologies";
  const companyLogo = siteConfig?.company_logo || "";

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleClick = () => {
    setOpenMobile(false);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  const renderMenu = (items: MenuItem[]) => {
    if (!mounted || !user) {
      return items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <div className="flex items-center gap-3 px-3 py-2 animate-pulse rounded-lg bg-slate-100">
            <div className="h-4 w-4 rounded bg-slate-200" />
            <div className="h-3 w-24 rounded bg-slate-200" />
          </div>
        </SidebarMenuItem>
      ));
    }

    return items.map((item) => {
        const isActive =
          item.url === "/dashboard"
            ? pathname === "/dashboard" || pathname === "/"
            : pathname.startsWith(item.url);

        return (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={isActive}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                isActive
                  ? "!bg-primary !text-white font-medium shadow-xs"
                  : "text-slate-600 hover:!bg-sky-mist hover:!text-primary"
              )}
            >
              <Link href={item.href} onClick={handleClick}>
                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "!text-white" : "text-primary"
                  )}
                />
                <span className="truncate">{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      });
  };

  return (
    <Sidebar className="border-r border-slate-200 bg-white">
      <SidebarContent className="p-3 bg-white">
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 mb-3 border-b border-slate-100 px-2 pt-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3.5 hover:opacity-90 transition-opacity"
          >
            {companyLogo ? (
              <div className="relative w-9 h-9 overflow-hidden flex items-center justify-center shrink-0">
                <Image
                  src={companyLogo}
                  alt={companyName}
                  fill
                  sizes="36px"
                  className="object-contain"
                />
              </div>
            ) : (
              <div className="w-9 h-9 flex items-center justify-center text-primary shrink-0">
                {/* Clean geometric Milanova M line-art mark from screenshot */}
                <svg
                  className="w-8 h-8 text-primary"
                  viewBox="0 0 32 32"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M4 6h4l8 12 8-12h4v20h-4V12L16 24 8 12v14H4V6z" />
                </svg>
              </div>
            )}
            <div className="flex flex-col text-left">
              <span className="text-[13px] font-semibold text-primary leading-tight">
                {companyName || "Milanova Technologies"}
              </span>
              <span className="text-[13px] font-bold text-slate-900 leading-tight">
                Admin Panel
              </span>
            </div>
          </Link>

          {isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpenMobile(false)}
              className="h-8 w-8 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* Modules Navigation */}
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="text-[11px] font-bold tracking-wider text-slate-400 uppercase px-2 mb-2">
            ADMIN CMS MODULES
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {renderMenu(adminCmsModules)}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {user && (
        <SidebarFooter className="border-t border-slate-100 p-2 bg-white">
          <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 font-bold text-xs">
              {(user.Name || user.name || "A")[0].toUpperCase()}
            </div>
            <div
              className={`flex flex-col flex-1 overflow-hidden transition-all duration-200 ${state === "collapsed" && !isMobile ? "opacity-0 w-0" : "opacity-100"
                }`}
            >
              <span className="text-xs font-semibold truncate text-slate-800">
                {user.Name || user.name || "Super Admin"}
              </span>
              <span className="text-[11px] text-slate-500 truncate">
                {user.Email || user.email || "admin@milanova-tech.com"}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
