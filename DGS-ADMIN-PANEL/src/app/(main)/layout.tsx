import Image from "next/image";
import { AppSidebar } from "@/components/layout/app-sidebar";
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { getSiteConfig } from "@/services/settings/settings.service";
import { fetchProfile } from "@/services/auth/auth.service";
import { AuthProvider } from "@/context/AuthContext";

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [siteConfig, profile] = await Promise.all([
    getSiteConfig().catch(() => ({})),
    fetchProfile().catch(() => null),
  ]);

  const user = profile?.data || profile;

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 font-medium bg-slate-50">
        Redirecting to login...
      </div>
    );
  }

  const config = siteConfig as { company_logo?: string; company_name?: string };
  const companyLogo = config?.company_logo || "";
  const companyName = config?.company_name || "";

  return (
    <SiteConfigProvider config={siteConfig}>
      <AuthProvider initialUser={user}>
        <SidebarProvider>
          <AppSidebar />

          <SidebarInset className="bg-slate-50/70">
            <div className="flex items-center gap-3 border-b px-4 py-2.5 lg:hidden bg-white">
              <SidebarTrigger />
              {companyLogo ? (
                <div className="relative h-8 w-28 flex items-center">
                  <Image
                    src={companyLogo}
                    alt={companyName || "Logo"}
                    fill
                    sizes="112px"
                    className="object-contain object-left"
                    priority
                  />
                </div>
              ) : (
                <span className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                  {companyName || "Admin Panel"}
                </span>
              )}
            </div>

            <div className="flex-1 p-4 md:p-8">{children}</div>
          </SidebarInset>
        </SidebarProvider>
      </AuthProvider>
    </SiteConfigProvider>
  );
}
