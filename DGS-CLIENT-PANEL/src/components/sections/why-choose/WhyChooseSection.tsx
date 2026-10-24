/* Figma — file TDkBTr4SAL7t8BDLAqNjvG, node 8:400
   "SECTION 3: WHY CHOOSE DIGITAL GAS SERVICE" (1280 × 938).
   Colours / type steps / radii / gaps are lifted 1:1 from Figma's
   "Copy as code → CSS (all layers)" export; the four card glyphs are the
   original vector paths (their viewBox is the 48 × 48 tile they sit in). */

const HEADING = "#001026"; // Plus Jakarta Sans headings
const BODY = "#44474E"; // Inter body copy

/* Card glyphs exported from the Figma node — one path per 48×48 tile,
   viewBox keeps them centred exactly as designed. */
const PILLARS = [
  {
    tile: "#002B1B",
    fill: "#4EDEA3",
    viewBox: "42 41 48 48",
    path: "M65.9998 76.6666C63.2971 75.986 61.0658 74.4353 59.3061 72.0145C57.5464 69.5937 56.6665 66.9055 56.6665 63.9499V56.8333L65.9998 53.3333L75.3332 56.8333V63.9499C75.3332 66.9055 74.4533 69.5937 72.6936 72.0145C70.9339 74.4353 68.7026 75.986 65.9998 76.6666V76.6666M65.9998 74.2166C68.0221 73.5749 69.6943 72.2916 71.0165 70.3666C72.3387 68.4416 72.9998 66.3027 72.9998 63.9499V58.4374L65.9998 55.8124L58.9998 58.4374V63.9499C58.9998 66.3027 59.6609 68.4416 60.9832 70.3666C62.3054 72.2916 63.9776 73.5749 65.9998 74.2166V74.2166M65.9998 64.9999V64.9999V64.9999V64.9999V64.9999V64.9999V64.9999V64.9999V64.9999V64.9999",
    title: "100% Safety Guarantee",
    desc: "Strict adherence to global safety codes, high-pressure nitrogen testing, and integrated automatic emergency isolation sensors.",
  },
  {
    tile: "#1B3C65",
    fill: "#D5E3FF",
    viewBox: "356 41 48 48",
    path: "M370.667 76.6666C370.025 76.6666 369.476 76.4381 369.019 75.9812C368.562 75.5242 368.333 74.9749 368.333 74.3333V61.4999C368.333 60.8583 368.562 60.3089 369.019 59.852C369.476 59.3951 370.025 59.1666 370.667 59.1666H376.5V55.6666C376.5 55.0249 376.729 54.4756 377.186 54.0187C377.643 53.5617 378.192 53.3333 378.833 53.3333H381.167C381.808 53.3333 382.358 53.5617 382.815 54.0187C383.272 54.4756 383.5 55.0249 383.5 55.6666V59.1666H389.333C389.975 59.1666 390.524 59.3951 390.981 59.852C391.438 60.3089 391.667 60.8583 391.667 61.4999V74.3333C391.667 74.9749 391.438 75.5242 390.981 75.9812C390.524 76.4381 389.975 76.6666 389.333 76.6666H370.667V76.6666M370.667 74.3333H389.333V74.3333V74.3333V61.4999V61.4999V61.4999H383.5V61.4999C383.5 62.1416 383.272 62.6909 382.815 63.1478C382.358 63.6048 381.808 63.8333 381.167 63.8333H378.833C378.192 63.8333 377.643 63.6048 377.186 63.1478C376.729 62.6909 376.5 62.1416 376.5 61.4999V61.4999H370.667V61.4999V61.4999V74.3333V74.3333V74.3333V74.3333M373 71.9999H380V71.4749C380 71.1444 379.908 70.8381 379.723 70.5562C379.538 70.2742 379.281 70.0555 378.95 69.8999C378.561 69.7249 378.168 69.5937 377.769 69.5062C377.37 69.4187 376.947 69.3749 376.5 69.3749C376.053 69.3749 375.63 69.4187 375.231 69.5062C374.833 69.5937 374.439 69.7249 374.05 69.8999C373.72 70.0555 373.462 70.2742 373.277 70.5562C373.093 70.8381 373 71.1444 373 71.4749V71.9999V71.9999M382.333 70.2499H387V68.4999H382.333V70.2499V70.2499M376.5 68.4999C376.986 68.4999 377.399 68.3298 377.74 67.9895C378.08 67.6492 378.25 67.236 378.25 66.7499C378.25 66.2638 378.08 65.8506 377.74 65.5103C377.399 65.1701 376.986 64.9999 376.5 64.9999C376.014 64.9999 375.601 65.1701 375.261 65.5103C374.92 65.8506 374.75 66.2638 374.75 66.7499C374.75 67.236 374.92 67.6492 375.261 67.9895C375.601 68.3298 376.014 68.4999 376.5 68.4999V68.4999M382.333 66.7499H387V64.9999H382.333V66.7499V66.7499M378.833 61.4999H381.167V55.6666H378.833V61.4999V61.4999M380 67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166V67.9166",
    title: "Titas Gas 1st Class Enlisted",
    desc: "Officially enlisted 1st Class Contractor for Titas Gas Transmission & Distribution Co. Ltd., backed by seamless regulatory processing.",
  },
  {
    tile: "#E7EEFF",
    fill: "#FE6A34",
    viewBox: "670 41 48 48",
    path: "M680 72V70.1625C680 69.3264 680.428 68.6458 681.283 68.1208C682.139 67.5958 683.267 67.3333 684.667 67.3333C684.919 67.3333 685.163 67.3382 685.396 67.3479C685.629 67.3576 685.853 67.3819 686.067 67.4208C685.794 67.8292 685.59 68.2569 685.454 68.7042C685.318 69.1514 685.25 69.6181 685.25 70.1042V72H680V72M687 72V70.1042C687 69.4819 687.17 68.9132 687.51 68.3979C687.851 67.8826 688.332 67.4306 688.954 67.0417C689.576 66.6528 690.32 66.3611 691.185 66.1667C692.051 65.9722 692.989 65.875 694 65.875C695.031 65.875 695.978 65.9722 696.844 66.1667C697.709 66.3611 698.453 66.6528 699.075 67.0417C699.697 67.4306 700.174 67.8826 700.504 68.3979C700.835 68.9132 701 69.4819 701 70.1042V72H687V72M702.75 72V70.1042C702.75 69.5986 702.687 69.1222 702.56 68.675C702.434 68.2278 702.244 67.8097 701.992 67.4208C702.206 67.3819 702.424 67.3576 702.648 67.3479C702.872 67.3382 703.1 67.3333 703.333 67.3333C704.733 67.3333 705.861 67.591 706.717 68.1062C707.572 68.6215 708 69.3069 708 70.1625V72H702.75V72M689.479 69.6667H698.55V69.6667C698.356 69.2778 697.816 68.9375 696.931 68.6458C696.047 68.3542 695.069 68.2083 694 68.2083C692.931 68.2083 691.953 68.3542 691.069 68.6458C690.184 68.9375 689.654 69.2778 689.479 69.6667V69.6667V69.6667M684.667 66.1667C684.025 66.1667 683.476 65.9382 683.019 65.4812C682.562 65.0243 682.333 64.475 682.333 63.8333C682.333 63.1722 682.562 62.6181 683.019 62.1708C683.476 61.7236 684.025 61.5 684.667 61.5C685.328 61.5 685.882 61.7236 686.329 62.1708C686.776 62.6181 687 63.1722 687 63.8333C687 64.475 686.776 65.0243 686.329 65.4812C685.882 65.9382 685.328 66.1667 684.667 66.1667V66.1667M703.333 66.1667C702.692 66.1667 702.142 65.9382 701.685 65.4812C701.228 65.0243 701 64.475 701 63.8333C701 63.1722 701.228 62.6181 701.685 62.1708C702.142 61.7236 702.692 61.5 703.333 61.5C703.994 61.5 704.549 61.7236 704.996 62.1708C705.443 62.6181 705.667 63.1722 705.667 63.8333C705.667 64.475 705.443 65.0243 704.996 65.4812C704.549 65.9382 703.994 66.1667 703.333 66.1667V66.1667M694 65C693.028 65 692.201 64.6597 691.521 63.9792C690.84 63.2986 690.5 62.4722 690.5 61.5C690.5 60.5083 690.84 59.6771 691.521 59.0063C692.201 58.3354 693.028 58 694 58C694.992 58 695.823 58.3354 696.494 59.0063C697.165 59.6771 697.5 60.5083 697.5 61.5C697.5 62.4722 697.165 63.2986 696.494 63.9792C695.823 64.6597 694.992 65 694 65V65M694 62.6667C694.331 62.6667 694.608 62.5549 694.831 62.3313C695.055 62.1076 695.167 61.8306 695.167 61.5C695.167 61.1694 695.055 60.8924 694.831 60.6688C694.608 60.4451 694.331 60.3333 694 60.3333C693.669 60.3333 693.392 60.4451 693.169 60.6688C692.945 60.8924 692.833 61.1694 692.833 61.5C692.833 61.8306 692.945 62.1076 693.169 62.3313C693.392 62.5549 693.669 62.6667 694 62.6667V62.6667M694.029 69.6667V69.6667V69.6667V69.6667V69.6667V69.6667V69.6667V69.6667V69.6667M694 61.5V61.5V61.5V61.5V61.5V61.5V61.5V61.5V61.5V61.5",
    title: "Expert Engineering Team",
    desc: "Led by professional mechanical engineers and ASME/API certified pipeline welders with decades of technical field leadership.",
  },
  {
    tile: "#FFDBD0",
    fill: "#390C00",
    viewBox: "984 41 48 48",
    path: "M1005.96 75.5V68.5583L999.95 72.0292L997.908 68.5L1003.92 65L997.908 61.5292L999.95 58L1005.96 61.4708V54.5H1010.04V61.4708L1016.05 58L1018.09 61.5292L1012.08 65L1018.09 68.5L1016.05 72.0292L1010.04 68.5583V75.5H1005.96V75.5",
    title: "24/7 Emergency Response",
    desc: "Dedicated mobile units equipped with calibrated gas sniffer detectors and repair tooling ready to deploy 24/7 across Dhaka.",
  },
];

const METRICS = [
  { value: "500+", color: "#FE6A34", label: "Completed Projects", sub: "Residential, Commercial & Industrial" },
  { value: "15+", color: "#4EDEA3", label: "Years Experience", sub: "Excellence Since 2009" },
  { value: "99.9%", color: "#D5E3FF", label: "Safety Record", sub: "Zero Critical Accident Incident" },
  { value: "100+", color: "#FFDBD0", label: "Restaurants & Food Courts", sub: "Commercial Kitchen Networks" },
];

export default function WhyChooseSection() {
  return (
    <section id="why-choose" className="w-full bg-[#F0F3FF] py-16 lg:py-24">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center gap-12 px-6 lg:gap-16">
        {/* ── Section header (768px block, 2px stack gap) ─────── */}
        <div className="flex w-full max-w-[768px] flex-col items-center gap-[2px] pt-[2px] text-center">
          <span className="rounded-xl bg-[#F9F9FF] px-4 py-1 font-jetbrains text-[12px] font-medium uppercase leading-4 tracking-[1.2px] text-[#FE6A34]">
            Engineering Integrity
          </span>
          <h2
            className="font-jakarta text-[28px] font-bold leading-9 tracking-[-0.5px] sm:text-[32px] sm:leading-10 lg:text-[40px] lg:leading-[48px] lg:tracking-[-1px]"
            style={{ color: HEADING }}
          >
            Why Choose Digital Gas Service?
          </h2>
          <p
            className="max-w-[708px] pt-[2px] font-inter text-[15px] leading-6 sm:text-base"
            style={{ color: BODY }}
          >
            Zero compromise on gas safety. Certified mechanical engineers verify
            every joint, flange, and pressure valve to safeguard life and
            property.
          </p>
        </div>

        {/* ── 4 Strategic Pillars — 290px cards, 24px gap ─────── */}
        <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {PILLARS.map((p) => (
            <article
              key={p.title}
              className="flex flex-col gap-2 rounded-lg bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.05)] sm:p-10 lg:min-h-[296px]"
            >
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg"
                style={{ background: p.tile }}
                aria-hidden
              >
                <svg viewBox={p.viewBox} className="h-12 w-12">
                  <path d={p.path} fill={p.fill} />
                </svg>
              </span>
              <h3
                className="font-jakarta text-[18px] font-semibold leading-[26px]"
                style={{ color: HEADING }}
              >
                {p.title}
              </h3>
              <p className="font-inter text-[14px] leading-5" style={{ color: BODY }}>
                {p.desc}
              </p>
            </article>
          ))}
        </div>

        {/* ── Real-time Engineering Metrics Visual Strip ─────── */}
        <div className="w-full rounded-lg bg-[#005F9D] p-6 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] sm:p-10">
          <div className="grid grid-cols-2 gap-6 xl:grid-cols-4">
            {METRICS.map((m) => (
              <div key={m.label} className="flex flex-col items-center text-center">
                <span
                  className="font-jakarta text-[36px] font-extrabold leading-[44px] tracking-[-0.72px] sm:text-[44px] lg:text-[56px] lg:leading-[68px] lg:tracking-[-1.12px]"
                  style={{ color: m.color }}
                >
                  {m.value}
                </span>
                <span className="mt-1 font-jakarta text-[16px] font-semibold leading-[22px] text-white lg:text-[18px] lg:leading-[26px]">
                  {m.label}
                </span>
                <span className="font-inter text-[12px] leading-4 text-[#778DB2]">
                  {m.sub}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
