import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { Certificate } from '../../settings/entities/certificate.entity';

/**
 * Seeds the government & regulatory certifications from the design mockup
 * (see certifications_implementation_plan.md).
 *
 * Content is English only: the storefront renders it into Bangla at runtime via
 * the `<AutoTranslate>` layer, so the Bangla copy that used to sit beside it was
 * a second source of truth that drifted out of sync.
 *
 * The three presentation columns — `reg_no`, `category_icon`, `sub_label` — are
 * seeded so the section renders exactly as designed on a fresh install.
 *
 * `file_url` is empty: the real licence scans are uploaded by an admin. The
 * section renders a "document pending" card in that case, which is honest — a
 * seeded placeholder licence would be worse than none.
 *
 * Idempotent by `reg_no`, so re-running updates the copy rather than
 * duplicating rows.
 */

const AppDataSource = new DataSource({ ...dataSourceOptions, synchronize: false });

const CERTIFICATES: Array<Partial<Certificate>> = [
  {
    reg_no: 'REG #TGS-1C-4402',
    category_icon: 'award',
    sub_label: 'Verified & Active License',
    title: 'Titas Gas 1st Class Contractor License',
    description:
      'Officially recognised by the Bangladesh Gas Corporation as a first-class contractor, authorised to execute LPG reticulation, industrial pipeline and fire hydrant installations across residential and commercial projects.',
    issuing_authority: 'Bangladesh Gas Corporation (Titas)',
    year: 2024,
    is_featured: true,
    is_active: true,
    display_order: 1,
  },
  {
    reg_no: 'DEP-EXP-BULK-91',
    category_icon: 'medal',
    sub_label: 'Dept of Explosives',
    title: 'Dept of Explosives Bulk Gas Approval',
    description:
      'Full regulatory accreditation from the Department of Explosives for bulk LPG storage tanks, autogas refuelling plants and hazardous-area pipeline design at industrial and commercial scale.',
    issuing_authority: 'Department of Explosives',
    year: 2023,
    is_featured: true,
    is_active: true,
    display_order: 2,
  },
  {
    reg_no: 'FSCD-HYD-778',
    category_icon: 'flame',
    sub_label: 'Fire Safety Standard',
    title: 'Fire Service & Civil Defence NOC',
    description:
      'No Objection Certificate for the design and execution of fire hydrant, sprinkler and emergency water supply networks, obtained for every multi-storey commercial and industrial installation we deliver.',
    issuing_authority: 'Bangladesh Fire Service & Civil Defence',
    year: 2024,
    is_featured: true,
    is_active: true,
    display_order: 3,
  },
  {
    reg_no: 'ISO 9001:2015',
    category_icon: 'shield',
    sub_label: 'Global Accr.',
    title: 'ISO 9001:2015 Quality Management',
    description:
      'Certified quality management system covering design, procurement, installation testing and handover reporting for every project we execute.',
    issuing_authority: 'Certified Management Systems Auditor',
    year: 2025,
    is_featured: true,
    is_active: true,
    display_order: 4,
  },
  {
    reg_no: 'BERC-GAS-880',
    category_icon: 'scale',
    sub_label: 'BERC Code',
    title: 'BERC Registered Gas Contractor',
    description:
      'Enlisted gas infrastructure contractor with the Bangladesh Energy Regulatory Commission, delivering installation, inspection and operational certification in line with BERC codes.',
    issuing_authority: 'Bangladesh Energy Regulatory Commission',
    year: 2024,
    is_featured: true,
    is_active: true,
    display_order: 5,
  },
];

async function seedCertificates() {
  console.log('--- Initializing Certificate Seeder ---');
  await AppDataSource.initialize();

  const repo = AppDataSource.getRepository(Certificate);
  let created = 0;
  let updated = 0;

  for (const seed of CERTIFICATES) {
    const existing = seed.reg_no
      ? await repo.findOne({ where: { reg_no: seed.reg_no } })
      : null;

    if (existing) {
      // `file_url` is deliberately untouched: re-running the seed must not
      // wipe a licence scan an admin has since uploaded.
      const { file_url: _kept, thumb_url: _keptThumb, ...copy } = seed;
      await repo.save({ ...existing, ...copy });
      updated += 1;
    } else {
      await repo.save(repo.create({ ...seed, file_type: 'image' as const }));
      created += 1;
    }
  }

  console.log(`Certificates seeded — ${created} created, ${updated} updated.`);
  await AppDataSource.destroy();
  console.log('--- Certificate Seeder Completed Successfully ---');
}

seedCertificates().catch((err) => {
  console.error('Certificate seeder failed:', err);
  process.exit(1);
});