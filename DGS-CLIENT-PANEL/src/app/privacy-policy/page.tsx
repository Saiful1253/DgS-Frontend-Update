import React from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import { getSiteConfig } from "@/services/site-config/site-config.service";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { normalizeBlogEmbedUrls } from "@/lib/blog-content";

export const revalidate = 0;

export const metadata = {
  title: "Privacy Policy",
};

export default async function PrivacyPolicyPage() {
  const config = await getSiteConfig();
  const content = config.privacy_policy || "<h1>Privacy Policy</h1><p>No content defined yet.</p>";

  return (
    <>
      <Navbar />
      <div className="w-full bg-white min-h-screen pb-20 pt-20 md:pt-28 overflow-x-hidden">
        <div className="container mx-auto px-4 md:px-6">
          {/* 1. Header Bar */}
          <div className="py-4 border-b flex items-center justify-between">
            <Button variant="outline" asChild className="rounded-lg h-9 text-xs">
              <Link href="/">
                <ArrowLeft size={14} className="mr-1.5" /> Back to Home
              </Link>
            </Button>
          </div>

          <div className="py-6 md:py-10 space-y-6">
            {/* 3. Title */}
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Privacy Policy
              </h1>
            </div>

            {/* 4. Content Area - Strictly Boundary Constrained */}
            <div className="pt-6 md:pt-8 border-t border-slate-100 w-full min-w-0 max-w-full overflow-hidden">
              <div className="blog-details-content ql-snow w-full min-w-0 max-w-full">
                <div
                  className="ql-editor !w-full !max-w-full min-w-0 px-4 md:px-8 !py-0 !h-auto block
                [&_img]:w-full [&_img]:aspect-[2/1] md:[&_img]:aspect-[3/1] [&_img]:max-h-[400px] [&_img]:object-cover [&_img]:rounded-xl [&_img]:shadow-lg [&_img]:my-4
                [&_p]:text-base md:[&_p]:text-lg [&_p]:leading-relaxed [&_p]:text-slate-700 [&_p]:max-w-full [&_p]:break-words [&_p]:my-4
                [&_h2]:text-2xl md:[&_h2]:text-3xl [&_h2]:m-0 [&_h2]:font-black [&_h2]:text-slate-900 [&_h2]:tracking-tight [&_h2]:max-w-full
                [&_h3]:text-xl md:[&_h3]:text-2xl [&_h3]:m-0 [&_h3]:font-black [&_h3]:text-slate-900 [&_h3]:tracking-tight [&_h3]:max-w-full
                [&_a]:text-blue-600 [&_a]:underline [&_a]:break-all
                [&_strong]:text-slate-900 [&_strong]:font-bold
                [&_.ql-align-center]:text-center
                [&_.ql-align-right]:text-right
                [&_.ql-align-justify]:text-justify
                [&_.ql-size-small]:text-xs
                [&_.ql-size-large]:text-2xl
                [&_.ql-size-huge]:text-4xl"
                  dangerouslySetInnerHTML={{ __html: normalizeBlogEmbedUrls(content) }}
                />
              </div>
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
              /* SCOPED FIX FOR POLICY DETAILS ONLY */
              .blog-details-content .ql-editor ul {
                list-style-type: disc !important;
                padding-left: 1.5rem !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                display: block !important;
              }
              .blog-details-content .ql-editor ol {
                list-style-type: decimal !important;
                padding-left: 1.5rem !important;
                margin-top: 0 !important;
                margin-bottom: 0 !important;
                display: block !important;
              }
              .blog-details-content .ql-editor li {
                list-style-position: outside !important;
                margin-bottom: 0.5rem !important;
              }
              .blog-details-content .ql-editor iframe,
              .blog-details-content .ql-editor video {
                width: 100% !important;
                aspect-ratio: 16 / 9 !important;
                max-height: 480px;
                border: none !important;
                border-radius: 12px;
                margin: 1rem 0 !important;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
                display: block;
                object-fit: cover;
                background: #000;
              }
              `
            }} />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
