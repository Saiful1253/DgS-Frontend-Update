import AppDataSource from '../data-source';
import { Testimonial } from '../../testimonials/entities/testimonial.entity';

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected for seeding testimonials...');

  const repo = AppDataSource.getRepository(Testimonial);

  const count = await repo.count();
  if (count > 0) {
    console.log(`Found ${count} testimonials. Checking if seeds needed...`);
  }

  const sampleTestimonials = [
    {
      author_name: 'Engr. Tariqul Islam',
      author_role: 'Chief MEP Consultant',
      author_company: 'Shanta Holdings Ltd.',
      rating: 5,
      content:
        'DGS delivered flawless industrial LPG reticulation and kitchen fire suppression for our commercial tower. Their engineering compliance and zero-leak certification gave us total peace of mind.',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 1,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
    {
      author_name: 'Farhana Ahmed',
      author_role: 'Director of Hospitality Operations',
      author_company: 'Radisson Blu Hotel & Resort',
      rating: 5,
      content:
        'When renovating our central banquet kitchens, DGS executed the gas line manifold and NFPA-standard suppression system ahead of schedule. Top-notch professionalism and emergency response.',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 2,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
    {
      author_name: 'Mahbubur Rahman',
      author_role: 'Head of Facilities & Safety',
      author_company: 'Bashundhara Food & Beverage',
      rating: 5,
      content:
        'The technical caliber of the DGS gas safety team is unmatched. From high-pressure regulators to digital gas leak detection loops, every detail complied with national fire codes.',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 3,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
    {
      author_name: 'Syed Tanvir Hussain',
      author_role: 'Managing Partner',
      author_company: 'Cinnamon Tree Gourmet Chain',
      rating: 5,
      content:
        'We operate multiple cloud kitchens across Dhaka. DGS installed unified commercial kitchen suppression and manifold systems across 4 branches seamlessly. Highly recommended!',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 4,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
    {
      author_name: 'Kazi Nayeem',
      author_role: 'Project Director',
      author_company: 'Apex Footwear Ltd.',
      rating: 5,
      content:
        'Exceptional engineering expertise in factory boiler gas line setup and precision valve calibration. Their after-sales maintenance SLA has been consistent for the last 3 years.',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 5,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
    {
      author_name: 'Nusrat Jahan',
      author_role: 'Architect & Interior Lead',
      author_company: 'Studio Vista Architects',
      rating: 5,
      content:
        'Working with DGS ensures our architectural designs integrate kitchen hood suppression and gas detection seamlessly without compromising aesthetic appeal or safety standards.',
      status: 'approved' as const,
      is_active: true,
      is_featured: true,
      display_order: 6,
      source: 'admin',
      type: 'text',
      source_platform: 'Direct Client',
    },
  ];

  for (const t of sampleTestimonials) {
    const existing = await repo.findOne({ where: { author_name: t.author_name } });
    if (!existing) {
      await repo.save(repo.create(t));
      console.log(`Seeded testimonial: ${t.author_name}`);
    }
  }

  console.log('Seeding testimonials completed.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding error:', err);
  process.exit(1);
});
