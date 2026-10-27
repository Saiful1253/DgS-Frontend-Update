import React, { Suspense } from "react";
import ContactForm from "@/components/contact/contact-form";
import { getPublicServices } from "@/services/service/service.service";
import { BRAND } from "@/lib/brand";

export const revalidate = 3600;

export const metadata = {
  title: `Contact & Consultation | ${BRAND.name}`,
  description:
    "Talk to Digital Gas Service about LPG reticulation, autogas plants, industrial pipelines or fire protection. Request a quotation or a site visit.",
};

export default async function ContactPage() {
  // The form lets the visitor name the capabilities they care about, so the
  // options come from the same published data the services page renders rather
  // than a second hand-maintained list.
  const { groups } = await getPublicServices();
  const serviceOptions = groups.map((g) => g.name).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-white pb-24">
      <section className="relative pt-32 pb-16 overflow-hidden bg-gradient-to-b from-slate-900/80 via-slate-950 to-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6">
            Start a conversation
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            LET&apos;S BUILD SOMETHING THAT LASTS
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg">
            Tell us what you are building. We reply with a concrete approach, an
            estimate, and the questions we still need answered.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The form reads `?topic=` for its prefill, and `useSearchParams` opts a
            route into dynamic rendering unless it sits behind a Suspense boundary.
            The fallback keeps the static shell intact while it hydrates. */}
        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-2xl bg-slate-900/60 border border-slate-800/80" />
          }
        >
          <ContactForm serviceOptions={serviceOptions} />
        </Suspense>
      </section>
    </div>
  );
}
