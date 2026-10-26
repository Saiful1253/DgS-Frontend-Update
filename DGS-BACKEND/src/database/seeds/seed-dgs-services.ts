import AppDataSource from '../data-source';
import { Service } from '../../services/entities/service.entity';
import { ServicePillar } from '../../services/entities/service-pillar.entity';
import { ServiceGroup } from '../../services/entities/service-group.entity';

async function seedDgsServices() {
  console.log('Seeding DGS Engineering & Reticulation Services...');

  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const pillarRepo = AppDataSource.getRepository(ServicePillar);
  const groupRepo = AppDataSource.getRepository(ServiceGroup);
  const serviceRepo = AppDataSource.getRepository(Service);

  console.log('Resetting old services, groups, and pillars...');
  await serviceRepo.createQueryBuilder().delete().from(Service).execute();
  await groupRepo.createQueryBuilder().delete().from(ServiceGroup).execute();
  await pillarRepo.createQueryBuilder().delete().from(ServicePillar).execute();

  const pillarName = 'Engineering & Reticulation Systems';
  const pillarSlug = 'engineering-reticulation-systems';

  const pillar = await pillarRepo.save(
    pillarRepo.create({
      name: pillarName,
      slug: pillarSlug,
      display_label: 'Engineering & Pipeline Networks',
      blurb: 'Turnkey LPG reticulation, industrial gas piping, RMS stations, and fire hydrant safety grids.',
      display_order: 1,
      is_active: true,
    }),
  );
  console.log(' ✓ Created pillar:', pillarName);

  const dgsServices = [
    {
      name: 'Central LPG Reticulation System',
      slug: 'central-lpg-reticulation-system',
      spec_code: 'SPEC-LPG-CORE-01',
      badge_label: 'HIGHEST DEMAND IN BD',
      badge_status: 'AUTO-FAILSAFE',
      sub_title: 'Automated Digital Vaporizer & Dual Regulator',
      category_tag: 'NATIONAL LEADER IN RETICULATION SYSTEMS',
      tier_label: 'Flagship Specialty',
      image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
      is_flagship: true,
      description:
        "Bangladesh's foremost turnkey pipeline infrastructure for modern high-rise apartments, gated housing communities, multi-stall food courts, and luxury hotel kitchens — replacing cumbersome individual cylinders with safe, centralized bulk storage and smart meters.",
      features: [
        {
          title: 'Auto-Regulated Manifold',
          description: 'Dual stage regulators & automated multi-cylinder vaporizers for seamless constant pressure.',
          icon: 'sliders',
        },
        {
          title: 'Prepaid Smart LoRa Meters',
          description: 'Individual prepaid telemetry digital meters per apartment with remote top-up and billing.',
          icon: 'radio',
        },
        {
          title: 'Automated Safety Shut-Off',
          description: 'Optical sniffer sensors with fast solenoid shut-off valves at apartment and bank intake.',
          icon: 'shield-alert',
        },
        {
          title: '100% Hydro-Tested & Certified',
          description: 'Full nitrogen purging, hydrostatic testing up to 1.5x operating limit, and Titas Gas licensing liaison.',
          icon: 'check-circle',
        },
      ],
      compliance_codes: 'NFPA 58 • BNBC Code 2020 • Dept. of Explosives Approved',
      cta_label: 'Request Reticulation Design Blueprint & Audit',
      cta_url: '/contact?topic=lpg-reticulation',
    },
    {
      name: 'AutoGas Plant & Pipeline',
      slug: 'autogas-plant-pipeline',
      spec_code: 'PLANT-AG-02',
      badge_label: 'Govt. Certified',
      badge_status: null,
      sub_title: null,
      category_tag: 'AutoGas Infrastructure',
      tier_label: 'Turnkey Blueprint',
      image_url: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
      is_flagship: false,
      description:
        'Turnkey engineering, civil shielding, and installation for automotive refueling stations with strict Dept. of Explosives compliance.',
      features: [
        {
          title: 'Explosives Approved Bullet Tanks',
          description: 'Underground/mounded ASME pressure vessels with cathodic protection.',
        },
        {
          title: 'ATEX Certified Dispensers & Barriers',
          description: 'Flameproof electrical installation with safety breakaway couplings.',
        },
      ],
      compliance_codes: 'Dept. of Explosives Certified • BNBC 2020',
      cta_label: 'Station Specs',
      cta_url: '/contact?topic=autogas-station',
    },
    {
      name: 'Industrial Pipe Network',
      slug: 'industrial-pipe-network',
      spec_code: 'IND-PIPE-03',
      badge_label: 'Sch 40/80',
      badge_status: null,
      sub_title: null,
      category_tag: 'Heavy Industrial Gas',
      tier_label: 'Industrial Grade',
      image_url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80',
      is_flagship: false,
      description:
        'Heavy industrial gas networks engineered for textile spinning mills, ceramic kilns, boilers, and captive energy setups.',
      features: [
        {
          title: 'Seamless Sch 40/80 Carbon Steel',
          description: 'ASTM A106 Grade B seamless pipes engineered for high pressure manifolds.',
        },
        {
          title: '100% X-Ray Certified Welds',
          description: 'Radiographic weld inspection and hydraulic pressure tests.',
        },
      ],
      compliance_codes: 'ASME B31.3 • BNBC 2020',
      cta_label: 'Explore Piping',
      cta_url: '/contact?topic=industrial-gas',
    },
    {
      name: 'Utility Gas (RMS & TBS)',
      slug: 'utility-gas-rms-tbs',
      spec_code: 'TITAS-GAS-04',
      badge_label: '1st Class License',
      badge_status: null,
      sub_title: null,
      category_tag: 'Titas Enlisted Protocol',
      tier_label: 'Titas Enlisted',
      image_url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
      is_flagship: false,
      description:
        'Official Titas Gas 1st Class protocol implementations for high-volume intake, governor calibration, and custody transfer regulation.',
      features: [
        {
          title: 'RMS Station Assembly & Testing',
          description: 'Regulating and metering skid assembly with filter separators and slam-shut valves.',
        },
        {
          title: 'Utility Load Approval Liaison',
          description: 'Direct liaison with utility providers for load sanctioning and commissioning.',
        },
      ],
      compliance_codes: 'Titas Gas 1st Class Enlisted',
      cta_label: 'RMS Licensing',
      cta_url: '/contact?topic=titas-gas',
    },
    {
      name: 'Fire Hydrant & Safety Grids',
      slug: 'fire-hydrant-safety-grids',
      spec_code: 'SAFETY-HYD-05',
      badge_label: 'NFPA 20',
      badge_status: null,
      sub_title: null,
      category_tag: 'Statutory Fire Grids',
      tier_label: 'Certified Safety',
      image_url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80',
      is_flagship: false,
      description:
        'Statutory fire protection networks and deluge pump houses built strictly to NFPA 20 and Bangladesh Fire Service regulations.',
      features: [
        {
          title: 'NFPA 20 Industrial Pump Houses',
          description: 'Main electric, diesel backup, and jockey pump automated pressure maintenance.',
        },
        {
          title: 'Fire Service NOC Clearance',
          description: 'Full statutory compliance liaison with Fire Service & Civil Defence Directorate.',
        },
      ],
      compliance_codes: 'NFPA 20 • FSCD Approved',
      cta_label: 'Inspect Hydrants',
      cta_url: '/contact?topic=fire-hydrant',
    },
  ];

  for (const s of dgsServices) {
    const item = serviceRepo.create({
      ...s,
      pillar: pillar.name,
      pillar_id: pillar.id,
      is_active: true,
      is_deleted: false,
    });
    await serviceRepo.save(item);
    console.log(' ✓ Created service:', s.name);
  }

  console.log('✓ DGS Engineering Services reset and seeded fresh successfully.');
  await AppDataSource.destroy();
}

seedDgsServices().catch((err) => {
  console.error('Error seeding DGS services:', err);
  process.exit(1);
});
