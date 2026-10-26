import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { CompanySetting } from '../../settings/entities/company-setting.entity';
import { SiteSetting } from '../../site-settings/entities/site-setting.entity';

/**
 * Writes Digital Gas Service into the settings the storefront reads.
 *
 * The public site resolves its brand, contact details and social links from two
 * rows — `company_settings` (served by `/client/config`, which is what the
 * Navbar, Footer, contact page and home metadata all normalise) and
 * `site_settings` (a key/value map for logo, favicon and meta tags). Seeding
 * those two rows rebrands the running site in one command; editing every page
 * component instead would leave the admin panel showing the old name.
 *
 * **Destructive by design:** this overwrites brand, contact and social values.
 * That is the point of a rebrand script, but it means it must not be run
 * against a database whose contact details someone has already updated by hand.
 *
 * Company logo, favicon and OG image are *not* written — they are binary
 * assets uploaded through the admin panel, and pointing them at a URL that does
 * not exist yet would replace a working image with a broken one.
 */

const AppDataSource = new DataSource({ ...dataSourceOptions, synchronize: false });

const COMPANY_PATCH: Partial<CompanySetting> = {
  legal_company_name: 'Digital Gas Service',
  brand_name: 'Digital Gas Service',
  mission_purpose:
    'Centralised LPG reticulation, industrial utility pipelines and fire protection systems for residential, commercial and industrial projects across Bangladesh.',
  eu_standards_badge_info:
    'First class Titas Gas contractor, Department of Explosives approved, BERC registered.',
  primary_headquarters_address: 'হাউজ #৭৩, মধ্য বাসাবো, সবুজবাগ, ঢাকা',
  official_emails: { general: 'digitalgasservice@gmail.com' },
  official_phones: { phone: '01778-277178', whatsapp: '01778277178', country_code: '+880' },
  social_links: {
    facebook: '',
    linkedin: '',
    youtube: '',
  },
  core_cta_objective: 'Request Consultation',
};

const SITE_SETTINGS: Record<string, string> = {
  site_meta_title: 'Digital Gas Service | LPG Reticulation & Industrial Piping Bangladesh',
  site_meta_description:
    'Centralised LPG reticulation systems, autogas plants, industrial utility pipelines and fire hydrant installations. First class Titas Gas contractor in Bangladesh.',
  site_meta_keywords:
    'LPG reticulation system, Digital Gas Service, autogas plant Bangladesh, industrial pipeline contractor, fire hydrant system, Titas Gas contractor, BERC registered contractor',
  copyright_text: '© Digital Gas Service. All rights reserved.',
};

async function seedDgsSiteConfig() {
  console.log('--- Initializing DGS Site Config Seeder ---');
  await AppDataSource.initialize();

  // ── company_settings: one row, keyed by nothing ─────────────────────────
  const companyRepo = AppDataSource.getRepository(CompanySetting);
  const existingCompany = await companyRepo.findOne({ where: {} });

  if (existingCompany) {
    await companyRepo.save({ ...existingCompany, ...COMPANY_PATCH });
    console.log('company_settings updated.');
  } else {
    await companyRepo.save(companyRepo.create({ ...COMPANY_PATCH }));
    console.log('company_settings created.');
  }

  // ── site_settings: key/value upsert ─────────────────────────────────────
  const siteRepo = AppDataSource.getRepository(SiteSetting);
  for (const [key, value] of Object.entries(SITE_SETTINGS)) {
    const existing = await siteRepo.findOne({ where: { key } });
    if (existing) {
      existing.value = value;
      await siteRepo.save(existing);
    } else {
      await siteRepo.save(siteRepo.create({ key, value }));
    }
  }
  console.log(`site_settings upserted — ${Object.keys(SITE_SETTINGS).length} keys.`);

  console.log('Logo, favicon and OG image are left as-is: upload them in the admin panel.');
  await AppDataSource.destroy();
  console.log('--- DGS Site Config Seeder Completed Successfully ---');
}

seedDgsSiteConfig().catch((err) => {
  console.error('DGS site config seeder failed:', err);
  process.exit(1);
});