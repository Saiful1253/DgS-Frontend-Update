import {
  getCertificatesResult,
  getCertificateStatsResult,
} from "@/services/certificate/certificate.service";
import { certificateListQuerySchema } from "@/zod/certificate.validation";
import CertificatesManager from "@/components/certificates/certificates-manager";
import LoadErrorPanel from "@/components/common/load-error-panel";
import type { CertificateStats } from "@/types/certificate";

export const revalidate = 0;

export const metadata = {
  title: "Certifications | DGS Admin",
  description:
    "Manage government & regulatory certifications — licences, approvals and compliance documents shown on the storefront.",
};

/** Flatten a `string | string | undefined` search param to a single string. */
function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CertificatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const parsed = certificateListQuerySchema.parse({
    page: first(sp.page),
    limit: first(sp.limit),
    search: first(sp.search),
    sortBy: first(sp.sortBy),
    sortOrder: first(sp.sortOrder),
    is_active: first(sp.is_active),
    is_featured: first(sp.is_featured),
    file_type: first(sp.file_type),
  });

  const [result, statsResult] = await Promise.all([
    getCertificatesResult({
      page: parsed.page,
      limit: parsed.limit,
      search: parsed.search || undefined,
      sortBy: parsed.sortBy,
      sortOrder: parsed.sortOrder,
      is_active: parsed.is_active,
      is_featured: parsed.is_featured,
      file_type: parsed.file_type,
    }),
    getCertificateStatsResult(),
  ]);

  // A failed read must not render as an empty library — that reads as "this
  // site has no certifications" rather than "the request failed".
  if (!result.ok) {
    return <LoadErrorPanel subject="certifications" message={result.message} />;
  }

  const initialStats: CertificateStats = statsResult.ok
    ? statsResult.data
    : {
        total: result.data.meta.total,
        active: result.data.data.filter((c) => c.is_active).length,
        featured: result.data.data.filter((c) => c.is_featured).length,
        inactive: result.data.data.filter((c) => !c.is_active).length,
      };

  return (
    <CertificatesManager
      initialCertificates={result.data.data}
      meta={result.data.meta}
      initialStats={initialStats}
      query={{
        page: parsed.page,
        limit: parsed.limit,
        search: parsed.search,
        sortBy: parsed.sortBy,
        sortOrder: parsed.sortOrder,
        is_active: parsed.is_active,
        is_featured: parsed.is_featured,
        file_type: parsed.file_type,
      }}
    />
  );
}