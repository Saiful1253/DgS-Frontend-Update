import AppDataSource from '../data-source';
import { PortfolioCategory } from '../../portfolio/entities/portfolio-category.entity';

const DGS_CATEGORIES = [
  'Central LPG Reticulation',
  'Industrial Heavy Piping',
  'AutoGas Refueling Stations',
  'Utility RMS & Compliance',
  'Commercial & Residential Gas',
  'Fire Protection & Hydrants',
];

async function seedDgsCategories() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(PortfolioCategory);

  for (const name of DGS_CATEGORIES) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const exists = await repo.findOne({ where: { name } });
    if (!exists) {
      await repo.save(repo.create({ name, slug }));
      console.log('Seeded category:', name);
    }
  }

  await AppDataSource.destroy();
  console.log('Finished seeding DGS portfolio categories.');
}

seedDgsCategories().catch((err) => {
  console.error(err);
  process.exit(1);
});
