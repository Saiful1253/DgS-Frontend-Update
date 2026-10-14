import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../users/user.entity';
import { Role } from '../../roles/role.entity';

/**
 * Admin seeding — roles + users only.
 *
 * NOTE: The permission system has been removed. There is no permission matrix,
 * no role↔permission join and no per-user overrides. Every authenticated user
 * has full access; roles are kept purely as organisational labels.
 */

/** Access tiers seeded per SRS §4 Users & Roles. */
export const ROLES: { name: string; description: string; is_system?: boolean }[] = [
  { name: 'super_admin',         description: 'Super Admin — full platform control', is_system: true },
  { name: 'owner',               description: 'Owner — system-protected account holder', is_system: true },
  { name: 'editor_content_lead', description: 'Content Lead — manages CMS content' },
  { name: 'hr_recruiter',        description: 'HR / Recruiter — manages jobs and applicants' },
  { name: 'sales_lead',          description: 'Sales Lead — manages leads pipeline' },
];

const ADMIN_USERS: {
  username: string;
  name: string;
  email: string;
  phone?: string;
}[] = [
  { username: 'super_admin', name: 'Super Admin', email: 'admin@milanova.tech', phone: '+39 02 1234 5678' },
  { username: 'shahnawaz', name: 'Shahnawaz Sazid', email: 'shahnawazsazid60@gmail.com' },
];

const DEFAULT_PASSWORD = 'Admin@123';

async function upsert<T extends { id?: number }>(
  repo: any,
  find: Partial<T>,
  merge: Partial<T>,
): Promise<T> {
  const existing = await repo.findOneBy(find);
  if (existing) return repo.save({ ...existing, ...merge });
  return repo.save(repo.create({ ...find, ...merge }));
}

export async function seedAdminData(dataSource: DataSource): Promise<void> {
  console.log('🔐  Seeding admin roles and users...');

  const roleRepo = dataSource.getRepository(Role);
  const userRepo = dataSource.getRepository(User);

  // ── 1. Roles ───────────────────────────────────────────────────
  const savedRoles: Record<string, Role> = {};
  for (const role of ROLES) {
    savedRoles[role.name] = await upsert(
      roleRepo,
      { name: role.name } as any,
      {
        description: role.description,
        status: 'active',
        is_deleted: false,
        is_system: role.is_system ?? false,
      } as any,
    );
  }
  console.log(`   ✔  Seeded ${Object.keys(savedRoles).length} roles.`);

  // ── 2. Admin users ─────────────────────────────────────────────
  const adminRole = savedRoles['super_admin'];
  const defaultPasswordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  for (const u of ADMIN_USERS) {
    const user = await upsert<User>(
      userRepo,
      { email: u.email } as any,
      {
        username: u.username,
        name: u.name,
        email: u.email,
        mobile_number: u.phone ?? null,
        password: defaultPasswordHash,
        role_id: adminRole.id,
        status: 'active',
        is_deleted: false,
      } as any,
    );
    console.log(`   ✔  Seeded user ${user.email} (role=${adminRole.name}) — password ${DEFAULT_PASSWORD}.`);
  }
}
