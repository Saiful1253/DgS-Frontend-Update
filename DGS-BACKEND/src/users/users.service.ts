import {
  Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Role } from '../roles/role.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { isSelf } from '../common/utils/role-hierarchy.util';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../auth/auth.service';
import { UpdateProfileDto } from '../auth/dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private repo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  // ─── private helpers ────────────────────────────────────────────────────────

  /** Target user কে role সহ লোড করো */
  private async loadWithRole(id: number): Promise<User> {
    const user = await this.repo.findOne({ where: { id, is_deleted: false }, relations: ['role'] });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /**
   * দুটো hard rule একসাথে চেক:
   *
   * Rule 1 — Self-action নিষিদ্ধ
   *   কেউ নিজের account modify করতে পারবে না।
   *
   * Rule 2 — System-protected role block
   *   target এর role is_system = true হলে
   *   শুধু owner touch করতে পারবে, বাকি সবাই 403।
   */
  private assertCanActOn(actor: User, target: User, action: string): void {
    // Rule 1: Self-action
    if (isSelf(actor.id, target.id)) {
      throw new ForbiddenException(
        `নিজের account ${action} করা যাবে না।`,
      );
    }

    // Rule 2: System-protected role (e.g. owner)
    if (target.role?.is_system && actor.role?.name?.toLowerCase() !== 'owner') {
      throw new ForbiddenException(
        `"${target.role.name}" role এর user কে ${action} করা যাবে না।`,
      );
    }
  }

  /**
   * নতুন user এ বা update তে যে role assign হচ্ছে সেটা system-protected কিনা চেক।
   * owner ছাড়া কেউ is_system role assign করতে পারবে না।
   */
  private async assertCanAssignRole(actor: User, roleId: number): Promise<void> {
    const role = await this.roleRepo.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    // কেউ is_system role assign করতে পারবে না — owner ও না
    if (role.is_system) {
      throw new ForbiddenException(
        `"${role.name}" role কাউকে assign করা যাবে না।`,
      );
    }
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────────

  async findAll(page = 1, limit = 20, search?: string) {
    const qb = this.repo.createQueryBuilder('u')
      .leftJoinAndSelect('u.role', 'role')
      .select([
        'u.id', 'u.username', 'u.name', 'u.email', 'u.mobile_number',
        'u.role_id', 'u.status', 'u.last_login_at', 'u.created_at', 'role.name',
      ])
      .where('u.is_deleted = :is_deleted', { is_deleted: false })
      .orderBy('u.created_at', 'DESC');

    if (search) {
      qb.andWhere('(u.name ILIKE :s OR u.email ILIKE :s)', { s: `%${search}%` });
    }

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: number): Promise<User> {
    return this.loadWithRole(id);
  }

  /**
   * নতুন user তৈরি।
   * owner ছাড়া কেউ is_system role এর user তৈরি করতে পারবে না।
   */
  async create(actor: User, dto: CreateUserDto): Promise<User> {
    const exists = await this.repo.findOne({ where: { email: dto.email, is_deleted: false } });
    if (exists) throw new ConflictException('Email already in use');

    if (dto.role_id) {
      await this.assertCanAssignRole(actor, dto.role_id);
    }

    const user = this.repo.create(dto);
    return this.repo.save(user);
  }

  /**
   * User update।
   * - নিজেকে update করা যাবে না
   * - is_system role এর user → শুধু owner update করতে পারবে
   * - is_system role assign → শুধু owner করতে পারবে
   */
  async update(actor: User, targetId: number, dto: UpdateUserDto): Promise<User> {
    const target = await this.loadWithRole(targetId);
    this.assertCanActOn(actor, target, 'update');

    if (dto.role_id && dto.role_id !== target.role_id) {
      await this.assertCanAssignRole(actor, dto.role_id);
    }

    const updateData = { ...dto };
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 12);
    }

    Object.assign(target, updateData);
    const saved = await this.repo.save(target);
    AuthService.invalidateProfileCache(targetId);
    return saved;
  }

  /**
   * User delete।
   * - নিজেকে delete করা যাবে না
   * - is_system role এর user → শুধু owner delete করতে পারবে
   */
  async remove(actor: User, targetId: number): Promise<{ message: string }> {
    const target = await this.loadWithRole(targetId);
    this.assertCanActOn(actor, target, 'delete');
    target.is_deleted = true;
    target.email = `${target.email}_deleted_${Date.now()}`;
    target.username = `${target.username}_deleted_${Date.now()}`;
    await this.repo.save(target);
    AuthService.invalidateProfileCache(targetId);
    return { message: 'User deleted' };
  }

  /**
   * PATCH /auth/profile
   * নিজের profile update — শুধু safe fields।
   * Allowed  : name, mobile_number, new_password (current চেক করে)
   * Blocked  : role_id, status, email, username
   */
  async updateProfile(actor: User, dto: UpdateProfileDto): Promise<Partial<User>> {
    if (dto.new_password) {
      if (!dto.current_password) {
        throw new BadRequestException('নতুন password দিতে হলে current_password দিতে হবে।');
      }

      // Password field আলাদা করে লোড করো (entity তে @Exclude থাকায়)
      const userWithPassword = await this.repo.findOne({
        where: { id: actor.id },
        select: ['id', 'password'],
      });

      const isValid = await bcrypt.compare(dto.current_password, userWithPassword.password);
      if (!isValid) {
        throw new ForbiddenException('Current password ভুল।');
      }

      actor.password = await bcrypt.hash(dto.new_password, 12);
    }

    // শুধু safe fields
    if (dto.name)          actor.name          = dto.name;
    if (dto.mobile_number) actor.mobile_number = dto.mobile_number;

    const saved = await this.repo.save(actor);

    // Invalidate cache
    AuthService.invalidateProfileCache(actor.id);

    // password বাদ দিয়ে return
    const { password, ...safeUser } = saved as any;
    return safeUser;
  }

  /** Email দিয়ে user খোঁজো — AuthService এর জন্য */
  async findByEmail(email: string): Promise<User | null> {
    return this.repo.findOne({ where: { email, is_deleted: false }, relations: ['role'] });
  }
}
