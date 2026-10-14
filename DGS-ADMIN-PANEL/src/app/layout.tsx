import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { publicFetch } from "@/lib/public-fetch";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export async function generateMetadata(): Promise<Metadata> {
  let companyName = "";
  let companyLogo = "";
  let description = "";

  try {
    const res = await publicFetch.get("/client/config");
    if (res.ok) {
      const body = await res.json();
      const config = body?.data ?? body ?? {};
      companyName = config.company_name || "";
      companyLogo = config.company_logo || "";
      description = config.company_short_description || "";
    }
  } catch {}

  return {
    title: {
      default: companyName ? `${companyName} | Admin Panel` : "Admin Panel",
      template: companyName ? `%s | ${companyName}` : `%s | Admin Panel`,
    },
    description: description || "Admin Panel",
    icons: companyLogo
      ? {
          icon: companyLogo,
          shortcut: companyLogo,
          apple: companyLogo,
        }
      : undefined,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${hankenGrotesk.variable} font-sans antialiased`}>
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
