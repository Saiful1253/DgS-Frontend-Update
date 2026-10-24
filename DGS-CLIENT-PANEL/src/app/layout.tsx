import type { Metadata } from "next";
import {
  Hanken_Grotesk,
  Geist_Mono,
  Space_Grotesk,
  Plus_Jakarta_Sans,
  Inter,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";
import SplashScreen from "@/components/shared/SplashScreen";
import AutoTranslate from "@/components/shared/AutoTranslate";
import { SiteConfigProvider } from "@/context/SiteConfigContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import FloatingWhatsApp from "@/components/shared/FloatingWhatsApp";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { Toaster } from "sonner";

// SRS 13.1: Hanken Grotesk across all typography levels. Variable axis
// (100-900) covers every weight used in the codebase, so one file serves all.
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
});

// Retained for the one monospaced slot (SearchModal SKU label). Hanken has no
// mono cut, so Geist_Mono covers that case.
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Second brand face. Engineering Services (Figma 8:142) sets every micro-label
// — badges, spec codes, CTAs, tags — in Space Grotesk while headings/body stay
// Hanken Grotesk. Static (not variable) so the 500/600/700 cuts match Figma.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

// Figma 8:400 (Why Choose Digital Gas Service) sets headings/metrics in
// Plus Jakarta Sans, body copy in Inter and the eyebrow label in JetBrains
// Mono. Static cuts so 600/700/800 match the design exactly.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter-body",
  subsets: ["latin"],
  weight: ["400"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  const companyName = siteConfig.company_name || "MilanoVA Technologies";
  const title = {
    default: siteConfig.site_meta_title || `${companyName} | Enterprise Tech & IT Solutions`,
    template: `${companyName} | %s`
  };
  const description = siteConfig.site_meta_description || (siteConfig.company_short_description
    ? siteConfig.company_short_description
    : "MilanoVA Technologies — Premier enterprise software, cloud infrastructure, AI solutions & IT consulting.");
  const logo = siteConfig.company_logo || "/favicon.ico";
  const ogImage = siteConfig.site_og_image || siteConfig.company_logo || "/images/og-image.webp";
  const keywordsString = siteConfig.site_meta_keywords || "enterprise software, cloud computing, AI solutions, IT consulting, full-stack engineering, MilanoVA";
  const keywords = keywordsString.split(",").map((k: string) => k.trim());

  return {
    title,
    description,
    keywords,
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3002"),
    openGraph: {
      title,
      description,
      siteName: companyName,
      images: [
        {
          url: ogImage,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    authors: [{ name: companyName }],
    icons: {
      icon: logo,
      shortcut: logo,
      apple: logo,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="t8Oyf20bPl5W-UsQvEsrEaxwM66bah4PHMnx8YyoYPM"
        />
        {/* Preconnect so the hero YouTube background starts playing ASAP. */}
        <link rel="preconnect" href="https://www.youtube.com" />
        <link rel="preconnect" href="https://www.youtube-nocookie.com" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <link rel="dns-prefetch" href="https://www.youtube.com" />
        <link rel="dns-prefetch" href="https://www.youtube-nocookie.com" />
      </head>
      {/* font-sans is required, not decorative: `@theme inline` inlines
          --font-sans instead of emitting it, so Tailwind's preflight
          `var(--default-font-family)` resolves to nothing and the whole site
          silently fell back to the system UI stack. */}
      <body
        className={`${hankenGrotesk.variable} ${geistMono.variable} ${spaceGrotesk.variable} ${plusJakartaSans.variable} ${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <SiteConfigProvider config={siteConfig}>
          <LanguageProvider>
            <AutoTranslate />
            <SplashScreen />
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
            <FloatingWhatsApp />
          </LanguageProvider>
        </SiteConfigProvider>

        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            style: {
              fontFamily: "var(--font-hanken-grotesk)",
              fontSize: "12px",
              fontWeight: 600,
              borderRadius: "12px",
            },
            classNames: {
              toast: "shadow-xl border",
              success: "border-emerald-200 dark:border-emerald-900",
              error: "border-red-200 dark:border-red-900",
            },
          }}
        />
      </body>
    </html>
  );
}
