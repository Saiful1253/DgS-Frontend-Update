import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../data-source';
import { seedAdminData } from './admin-seed.helper';

const AppDataSource = new DataSource({ ...dataSourceOptions, synchronize: false });

async function seedAdmin() {
  console.log('--- Initializing Admin Seeder ---');
  await AppDataSource.initialize();
  await seedAdminData(AppDataSource);
  await AppDataSource.destroy();
  console.log('--- Admin Seeder Completed Successfully ---');
}

seedAdmin().catch((err) => {
  console.error('Seeder failed:', err);
  process.exit(1);
});
