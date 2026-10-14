import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();
dotenv.config({ path: join(__dirname, '../../.env') });
dotenv.config({ path: join(process.cwd(), 'ITALY-PORTFOLIO-BACKED', '.env') });

/**
 * Shared DataSource config used by:
 * - TypeORM CLI (migrations:generate, migrations:run, migrations:revert)
 * - app.module.ts (runtime)
 * - seed.ts (seeding)
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',

  // Support both DATABASE_URL (Render/Railway/Heroku) and individual vars
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
      host: process.env.DATABASE_HOST || 'localhost',
      port: Number(process.env.DATABASE_PORT) || 5432,
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || '',
      database: process.env.DATABASE_NAME || 'milanova_db',
    }),

  // Entity discovery
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],

  // Migration files
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],

  // Migrations are the schema authority (there are 60+ of them). This previously
  // defaulted to `synchronize: NODE_ENV !== 'production'`, and docker-compose
  // sets NODE_ENV=development — so any non-prod environment silently mutated the
  // schema and drifted from the migration history. Now opt-in and explicit.
  synchronize: process.env.DB_SYNCHRONIZE === 'true',

  // Log queries only in development
  logging: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],

  ssl:
    process.env.DATABASE_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
};

const AppDataSource = new DataSource(dataSourceOptions);
export default AppDataSource;
