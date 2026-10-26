import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/* ── Figma Node 8:876: "SECTION 6: ABOUT US & LEADERSHIP" (1280 × 627) ── */
export default function AboutLeadershipSection() {
  return (
    <section id="about-us" className="w-full bg-[#F9F9FF] py-16 lg:py-24">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-stretch gap-8 lg:grid-cols-12 lg:gap-10">
          
          {/* ── Left 7 Cols: Company Profile (Node 8:878) ── */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-7">
            {/* Eyebrow Badge (Node 8:880) */}
            <div className="flex items-center">
              <span className="inline-flex items-center rounded-[4px] bg-[#DEE8FF] px-2 py-1 font-jetbrains text-[12px] font-medium leading-4 tracking-[0.48px] text-[#001026]">
                ABOUT DIGITAL GAS SERVICE
              </span>
            </div>

            {/* Heading 2 (Node 8:884) */}
            <h2 className="font-jakarta text-3xl font-bold leading-tight tracking-[-0.02em] text-[#001026] sm:text-4xl lg:text-[40px] lg:leading-[48px]">
              Engineering Excellence &amp;
              <br className="hidden sm:inline" /> Uncompromising Safety
            </h2>

            {/* Primary Description / Lead (Node 8:886) */}
            <p className="font-inter text-base font-bold leading-relaxed text-[#001026] sm:text-[18px] lg:leading-[28px]">
              Digital Gas Service has been a foremost name in Bangladesh&apos;s gas and energy
              engineering domain for over 15 years. We operate as an enlisted Titas Gas 1st
              Class Contractor with a large fleet of dedicated mechanical and piping engineers.
            </p>

            {/* Secondary Description (Node 8:888) */}
            <p className="font-inter text-sm font-normal leading-relaxed text-[#44474E] sm:text-[16px] lg:leading-[24px]">
              From luxury high-rise condominium reticulations to bustling food court pipelines
              and industrial textile boilers, we execute leak-proof, zero-risk gas systems strictly
              following BNBC and NFPA standards.
            </p>

            {/* Stats Row (Node 8:889) */}
            <div className="grid grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
              {/* Stat 1 */}
              <div className="flex flex-col justify-center rounded-[4px] bg-[#E7EEFF] p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <span className="font-jakarta text-[22px] font-semibold leading-[30px] text-[#001026]">
                  100%
                </span>
                <span className="font-inter text-[12px] font-normal leading-4 text-[#44474E]">
                  Leak-Proof Assurance
                </span>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col justify-center rounded-[4px] bg-[#E7EEFF] p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <span className="font-jakarta text-[22px] font-semibold leading-[30px] text-[#001026]">
                  24 Hours
                </span>
                <span className="font-inter text-[12px] font-normal leading-4 text-[#44474E]">
                  Emergency Fault Team
                </span>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col justify-center rounded-[4px] bg-[#E7EEFF] p-4 transition-transform duration-200 hover:-translate-y-0.5">
                <span className="font-jakarta text-[22px] font-semibold leading-[30px] text-[#001026]">
                  1st Class
                </span>
                <span className="font-inter text-[12px] font-normal leading-4 text-[#44474E]">
                  Titas Enlisted Contractor
                </span>
              </div>
            </div>
          </div>

          {/* ── Right 5 Cols: MD's Executive Quote Card (Node 8:905) ── */}
          <div className="relative flex flex-col justify-between gap-4 rounded-lg border border-slate-100/80 bg-white p-6 shadow-[0_8px_10px_-6px_rgba(0,0,0,0.1),0_20px_25px_-5px_rgba(0,0,0,0.1)] sm:p-10 lg:col-span-5">
            {/* Decorative Quote Mark (Node 8:925, 8:926) */}
            <div
              className="pointer-events-none absolute right-6 top-5 select-none text-[#DEE8FF] opacity-80"
              aria-hidden="true"
            >
              <svg
                width="48"
                height="36"
                viewBox="0 0 48 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="fill-current"
              >
                <path d="M0 21.6C0 12.8 5.6 4.8 14.4 0L18.4 5.6C12.8 8.8 10.4 12.8 9.6 16.8H18.4V36H0V21.6ZM29.6 21.6C29.6 12.8 35.2 4.8 44 0L48 5.6C42.4 8.8 40 12.8 39.2 16.8H48V36H29.6V21.6Z" />
              </svg>
            </div>

            {/* Profile Header (Node 8:906) */}
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-[#E7EEFF] ring-2 ring-[#DEE8FF]/80">
                <Image
                  src="/images/about/md-asaduzzaman.png"
                  alt="Md. Asaduzzaman (Asad)"
                  width={80}
                  height={80}
                  priority
                  className="h-full w-full object-cover object-top"
                />
              </div>
              <div className="flex flex-col">
                <h3 className="font-jakarta text-[20px] font-semibold leading-7 text-[#001026] sm:text-[22px]">
                  Md. Asaduzzaman (Asad)
                </h3>
                <span className="font-inter text-[13px] font-bold leading-[18px] text-[#FE6A34]">
                  Managing Director (MD)
                </span>
                <span className="font-inter text-[12px] font-normal leading-4 text-[#44474E]">
                  Digital Gas Service
                </span>
              </div>
            </div>

            {/* Highlight Quote Box (Node 8:916) */}
            <div className="rounded-[4px] bg-[#F0F3FF] p-4 pt-6 sm:p-5 sm:pt-6">
              <p className="font-inter text-[15px] font-normal italic leading-6 text-[#111C2D] sm:text-[16px]">
                &ldquo;Gas and pipeline safety is never an option; it is an absolute engineering
                commitment. Every single connection we build safeguards lives and continuous
                industrial operation.&rdquo;
              </p>
            </div>

            {/* Secondary Mission Paragraph (Node 8:918) */}
            <p className="font-inter text-[13px] font-normal leading-5 text-[#44474E] sm:text-[14px]">
              &ldquo;Our dedicated mission is delivering faultless, certified gas infrastructure across
              residential buildings, commercial kitchen hubs, and factories throughout Bangladesh.
              Stay secure while we safeguard your energy flow.&rdquo;
            </p>

            {/* Horizontal Border / Footer Action (Node 8:920) */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E7EEFF] pt-4">
              <span className="font-jetbrains text-[11px] font-medium tracking-[0.48px] text-[#44474E] sm:text-[12px]">
                EXECUTIVE STATEMENT • 2025
              </span>
              <Link
                href="/contact"
                className="group inline-flex items-center gap-1 font-inter text-[13px] font-bold text-[#001026] transition-colors hover:text-[#FE6A34]"
              >
                <span>Consult With MD</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
