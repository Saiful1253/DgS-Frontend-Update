import type { Metadata } from "next";
import { Award } from "lucide-react";
import { getCertificates } from "@/services/certificate/certificate.service";
import { CERTIFICATE_PAGE_SIZE } from "@/types/certificate";
import CertificatesClientView from "@/components/certificates/CertificatesClientView";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Certificates & Licences | Digital Gas Service",
  description:
    "Every licence, approval and compliance certificate Digital Gas Service works under — with the issuing body, the registration number, and the document itself.",
  keywords: [
    "Digital Gas Service certificates",
    "Titas Gas first class contractor license",
    "Department of Explosives approval",
    "BERC registered gas contractor",
    "ISO 9001 LPG reticulation",
    "fire hydrant NOC Bangladesh",
  ],
  alternates: { canonical: "/certificates" },
  openGraph: {
    title: "Certificates & Licences | Digital Gas Service",
    description:
      "Government and regulatory certifications, published in full with the issuing body and the document itself.",
    url: "/certificates",
    type: "website",
  },
};

export default async function CertificatesPage() {
  // The first batch renders on the server; the grid appends the rest as the
  // visitor scrolls. A failed read yields an empty page rather than a 500 —
  // an empty certificate gallery is a content state, not a broken route.
  const page = await getCertificates({ limit: CERTIFICATE_PAGE_SIZE }).catch(() => ({
    items: [],
    total: 0,
    hasMore: false,
    offset: 0,
    limit: CERTIFICATE_PAGE_SIZE,
  }));

  /**
   * `ItemList` of the certifications on the page.
   *
   * The point of publishing a licence is that a third party can find and check
   * it — a search result that shows the registration number is the difference
   * between a compliance claim and a verifiable one. Descriptions are stripped
   * of markup first; schema.org takes plain text.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Digital Gas Service — Government & Regulatory Certifications",
    numberOfItems: page.items.length,
    itemListElement: page.items.map((certificate, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "CreativeWork",
        name: certificate.title,
        ...(certificate.description
          ? {
              description: certificate.description
                .replace(/<[^>]*>/g, " ")
                .replace(/\s+/g, " ")
                .trim(),
            }
          : {}),
        ...(certificate.file_url ? { contentUrl: certificate.file_url } : {}),
        ...(certificate.issuing_authority
          ? { creator: { "@type": "Organization", name: certificate.issuing_authority } }
          : {}),
        ...(certificate.year ? { dateCreated: String(certificate.year) } : {}),
        ...(certificate.reg_no ? { identifier: certificate.reg_no } : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="border-b border-border bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-10 md:py-24">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-accent">
            <Award className="h-4 w-4" />
            Licences &amp; Compliance
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-foreground md:text-5xl">
            Certificates
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Licences, approvals and compliance papers in full — open any certificate
            to read it at size, or download the PDF.
          </p>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-12 md:px-10 md:py-16">
        <CertificatesClientView initialPage={page} />
      </main>
    </>
  );
}