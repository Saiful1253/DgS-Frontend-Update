import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  EntityTarget,
  ObjectLiteral,
  In,
} from 'typeorm';
import { Service } from './entities/service.entity';
import { ServiceGroup } from './entities/service-group.entity';
import { ServicePillar } from './entities/service-pillar.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceGroupDto } from './dto/create-service-group.dto';
import { UpdateServiceGroupDto } from './dto/update-service-group.dto';
import { CreateServicePillarDto } from './dto/create-service-pillar.dto';
import { UpdateServicePillarDto } from './dto/update-service-pillar.dto';
import { ServiceQueryDto, ServiceSortBy, SortOrder } from './dto/service-query.dto';

type OrderItem = { id: number; display_order: number };

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepo: Repository<Service>,
    @InjectRepository(ServiceGroup)
    private readonly groupRepo: Repository<ServiceGroup>,
    @InjectRepository(ServicePillar)
    private readonly pillarRepo: Repository<ServicePillar>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Integrity helpers ────────────────────────────────────────────────
  //
  // `services.pillar` / `service_groups.pillar` are denormalised name copies of
  // the `pillar_id` FK. Two representations of one fact drift the moment either
  // is written without the other, and a drifted row is invisible on the public
  // page: the tab list is built from `service_pillars`, so a service whose
  // `pillar` string names no live pillar renders nowhere. Every write path
  // therefore resolves the pillar through ONE row and derives both columns from
  // it — divergence stops being expressible.

  /** Resolve a pillar by name or slug, or 400. Soft-deleted pillars do not count. */
  private async resolvePillar(value: string): Promise<ServicePillar> {
    const pillar = await this.pillarRepo.findOne({
      where: [{ name: value }, { slug: value }],
      is_deleted: false,
    } as any);

    if (!pillar) {
      throw new BadRequestException(
        `Service pillar "${value}" does not exist. Create the pillar first, then assign the service or group to it.`,
      );
    }
    return pillar;
  }

  /** Resolve a group by id, or 400. Optionally require it to sit under `pillarId`. */
  private async resolveGroup(groupId: number, pillarId?: number | null): Promise<ServiceGroup> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId, is_deleted: false },
    });

    if (!group) {
      throw new BadRequestException(`Service group with ID ${groupId} does not exist`);
    }

    if (pillarId != null && group.pillar_id != null && group.pillar_id !== pillarId) {
      throw new BadRequestException(
        `Service group "${group.name}" belongs to a different pillar. ` +
          `A group and its services cannot sit under different pillars.`,
      );
    }

    return group;
  }

  /**
   * Apply a reorder payload inside one transaction.
   *
   * A bare `for (…) await update()` loop commits row-by-row: a failure on the
   * last item leaves the first N renumbered and the rest stale, with no record
   * that the reorder ever started. Ids are also validated up front so a
   * payload naming a soft-deleted or unknown row fails whole rather than
   * silently renumbering a partial set.
   */
  private async applyOrder(
    entity: EntityTarget<ObjectLiteral>,
    order: OrderItem[],
    label: string,
  ): Promise<boolean> {
    const ids = order.map((o) => o.id);
    const uniqueIds = [...new Set(ids)];

    if (uniqueIds.length !== ids.length) {
      throw new BadRequestException(`Duplicate ids in ${label} reorder payload`);
    }

    return this.dataSource.transaction(async (manager) => {
      const live = (await manager.find(entity, {
        where: { id: In(uniqueIds), is_deleted: false },
        select: { id: true },
      } as any)) as ObjectLiteral[];

      if (live.length !== uniqueIds.length) {
        const found = new Set(live.map((r) => Number(r.id)));
        const missing = uniqueIds.filter((id) => !found.has(id));
        throw new BadRequestException(
          `Unknown or deleted ${label} id(s): ${missing.join(', ')}`,
        );
      }

      for (const item of order) {
        await manager.update(entity, { id: item.id } as any, {
          display_order: item.display_order,
        } as any);
      }
      return true;
    });
  }

  // ── Pillars ──────────────────────────────────────────────────────────
  async findPillars(): Promise<ServicePillar[]> {
    return await this.pillarRepo.find({
      where: { is_deleted: false },
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async findPillarsPublic(): Promise<ServicePillar[]> {
    return await this.pillarRepo.find({
      where: { is_deleted: false, is_active: true },
      order: { display_order: 'ASC', name: 'ASC' },
    });
  }

  async createPillar(dto: CreateServicePillarDto): Promise<ServicePillar> {
    const existing = await this.pillarRepo.findOne({ where: { slug: dto.slug, is_deleted: false } });
    if (existing) {
      throw new ConflictException(`Pillar with slug "${dto.slug}" already exists`);
    }

    // `name` is the denormalised key children are matched on, so two live
    // pillars sharing a name would make a rename cascade ambiguous.
    const nameClash = await this.pillarRepo.findOne({
      where: { name: dto.name, is_deleted: false },
    });
    if (nameClash) {
      throw new ConflictException(`Pillar with name "${dto.name}" already exists`);
    }

    const pillar = this.pillarRepo.create({
      name: dto.name,
      slug: dto.slug,
      display_label: dto.display_label,
      blurb: dto.blurb || null,
      icon: dto.icon || null,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
    });

    return await this.pillarRepo.save(pillar);
  }

  async updatePillar(id: number, dto: UpdateServicePillarDto): Promise<ServicePillar> {
    const pillar = await this.pillarRepo.findOne({ where: { id, is_deleted: false } });
    if (!pillar) {
      throw new NotFoundException(`Pillar with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== pillar.slug) {
      const existing = await this.pillarRepo.findOne({ where: { slug: dto.slug, is_deleted: false } });
      if (existing) {
        throw new ConflictException(`Pillar with slug "${dto.slug}" already exists`);
      }
    }

    if (dto.name && dto.name !== pillar.name) {
      const clash = await this.pillarRepo.findOne({
        where: { name: dto.name, is_deleted: false },
      });
      if (clash) {
        throw new ConflictException(`Pillar with name "${dto.name}" already exists`);
      }
    }

    const renamed = !!dto.name && dto.name !== pillar.name;

    if (!renamed) {
      Object.assign(pillar, dto);
      return await this.pillarRepo.save(pillar);
    }

    // Cascade on `pillar_id`, the FK, not on the name string. Matching on the
    // name rewrites whichever rows happen to hold that text — including rows
    // whose FK points elsewhere — so a rename could repoint another pillar's
    // children. Transactional: a half-applied rename leaves the pillar renamed
    // but its children describing a pillar that no longer exists, which is
    // exactly the state the public page cannot render.
    return await this.dataSource.transaction(async (manager) => {
      Object.assign(pillar, dto);
      const saved = await manager.save(ServicePillar, pillar);

      await manager
        .createQueryBuilder()
        .update(ServiceGroup)
        .set({ pillar: dto.name })
        .where('pillar_id = :id', { id })
        .execute();

      await manager
        .createQueryBuilder()
        .update(Service)
        .set({ pillar: dto.name })
        .where('pillar_id = :id', { id })
        .execute();

      return saved;
    });
  }

  async removePillar(id: number): Promise<{ message: string }> {
    const pillar = await this.pillarRepo.findOne({ where: { id, is_deleted: false } });
    if (!pillar) {
      throw new NotFoundException(`Pillar with ID ${id} not found`);
    }

    // FK-only cascade, in one transaction. The previous `pillar = :name` branch
    // also caught rows whose name matched but whose `pillar_id` pointed at a
    // different pillar, deleting another pillar's content as a side effect.
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(ServiceGroup)
        .set({ is_deleted: true })
        .where('pillar_id = :id AND is_deleted = false', { id })
        .execute();

      await manager
        .createQueryBuilder()
        .update(Service)
        .set({ is_deleted: true })
        .where('pillar_id = :id AND is_deleted = false', { id })
        .execute();

      await manager.update(ServicePillar, { id }, { is_deleted: true });
    });

    return { message: 'Service pillar soft-deleted successfully' };
  }

  // ── Services ──────────────────────────────────────────────────────────
  async findAll(query: ServiceQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || 21;
    const skip = (page - 1) * limit;

    const qb = this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.group', 'g')
      .leftJoinAndSelect('s.pillarEntity', 'p')
      .where('s.is_deleted = :isDeleted', { isDeleted: false });

    if (query.pillar && query.pillar !== 'all') {
      // Match the joined pillar first; keep the raw-string arm so rows written
      // before the FK existed still resolve.
      qb.andWhere('(p.name = :pillar OR p.slug = :pillar OR s.pillar = :pillar)', {
        pillar: query.pillar,
      });
    }

    if (query.group_id) {
      qb.andWhere('s.group_id = :groupId', { groupId: query.group_id });
    }

    if (query.status && query.status !== 'all') {
      qb.andWhere('s.is_active = :isActive', { isActive: query.status === 'active' });
    }

    if (query.search && query.search.trim()) {
      const q = `%${query.search.trim()}%`;
      qb.andWhere(
        '(s.name ILIKE :q OR s.description ILIKE :q OR s.slug ILIKE :q OR g.name ILIKE :q)',
        { q },
      );
    }

    const sortColumnMap: Record<ServiceSortBy, string> = {
      [ServiceSortBy.NAME]: 's.name',
      [ServiceSortBy.PILLAR]: 'p.name',
      [ServiceSortBy.DISPLAY_ORDER]: 's.display_order',
      [ServiceSortBy.CREATED_AT]: 's.created_at',
      [ServiceSortBy.UPDATED_AT]: 's.updated_at',
    };

    const sortCol = sortColumnMap[query.sortBy || ServiceSortBy.DISPLAY_ORDER] || 's.display_order';
    const sortDir = (query.sortOrder || SortOrder.ASC).toUpperCase() as 'ASC' | 'DESC';

    qb.orderBy(sortCol, sortDir);
    if (sortCol !== 's.id') {
      qb.addOrderBy('s.id', 'ASC');
    }

    qb.skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async findAllPublic() {
    const services = await this.serviceRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.group', 'g')
      .leftJoinAndSelect('s.pillarEntity', 'p')
      .where('s.is_deleted = :isDeleted AND s.is_active = :isActive', {
        isDeleted: false,
        isActive: true,
      })
      // Order by the pillar's own display_order, not its name — the admin controls
      // tab sequence there. `s.id` is the tiebreaker: services in different groups
      // share display_order 1/2/3, and without it Postgres returns ties in any
      // order, which makes the public group sequence unstable between requests.
      .orderBy('p.display_order', 'ASC')
      .addOrderBy('p.name', 'ASC')
      .addOrderBy('s.display_order', 'ASC')
      .addOrderBy('s.id', 'ASC')
      .getMany();

    const pillars = await this.findPillarsPublic();

    // Ship the authoritative group list rather than letting the client infer
    // groups from the services it happens to receive. Previously a group whose
    // services were all inactive simply did not exist anywhere on the page, and
    // a group could not be staged or unpublished independently of its children.
    const groups = await this.groupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.pillarEntity', 'gp')
      .where('g.is_deleted = :isDeleted AND g.is_active = :isActive', {
        isDeleted: false,
        isActive: true,
      })
      .andWhere('gp.is_deleted = false AND gp.is_active = true')
      .orderBy('gp.display_order', 'ASC')
      .addOrderBy('g.display_order', 'ASC')
      .addOrderBy('g.name', 'ASC')
      .getMany();

    return { services, pillars, groups };
  }

  async findOne(id: number): Promise<Service> {
    const service = await this.serviceRepo.findOne({
      where: { id, is_deleted: false },
      relations: ['group', 'pillarEntity'],
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return service;
  }

  async create(dto: CreateServiceDto): Promise<Service> {
    const pillar = await this.resolvePillar(dto.pillar);

    if (dto.group_id != null) {
      await this.resolveGroup(dto.group_id, pillar.id);
    }

    const service = this.serviceRepo.create({
      group_id: dto.group_id ?? null,
      pillar_id: pillar.id,
      name: dto.name,
      slug: dto.slug,
      // Canonical name from the resolved row, not the caller's string.
      pillar: pillar.name,
      description: dto.description || null,
      icon_url: dto.icon_url || null,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
    });

    return await this.serviceRepo.save(service);
  }

  async update(id: number, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findOne(id);

    const pillar = dto.pillar ? await this.resolvePillar(dto.pillar) : null;
    const targetPillarId = pillar ? pillar.id : service.pillar_id;

    if (dto.group_id != null) {
      await this.resolveGroup(dto.group_id, targetPillarId);
    }

    Object.assign(service, {
      ...(dto.group_id !== undefined ? { group_id: dto.group_id } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      // Both columns move together, so they can no longer disagree.
      ...(pillar ? { pillar: pillar.name, pillar_id: pillar.id } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.icon_url !== undefined ? { icon_url: dto.icon_url } : {}),
      ...(dto.display_order !== undefined ? { display_order: dto.display_order } : {}),
      ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
    });

    return await this.serviceRepo.save(service);
  }

  async toggleStatus(id: number, is_active: boolean): Promise<Service> {
    const service = await this.findOne(id);
    service.is_active = is_active;
    return await this.serviceRepo.save(service);
  }

  async remove(id: number): Promise<{ message: string }> {
    const service = await this.findOne(id);
    await this.serviceRepo.update({ id }, { is_deleted: true });

    // Legacy rows were keyed by the name-slug; current rows use the service slug.
    // Strip both so no dangling key survives either write path.
    const keys = new Set<string>();
    if (service.slug) keys.add(service.slug);
    if (service.name) keys.add(service.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));

    if (keys.size > 0) {
      try {
        await this.dataSource.query(
          `UPDATE blogs
           SET related_service_keys = (
             SELECT jsonb_agg(elem)
             FROM jsonb_array_elements_text(related_service_keys) elem
             WHERE elem != ALL($1::text[])
           )
           WHERE related_service_keys IS NOT NULL
             AND related_service_keys ?| $1::text[]`,
          [Array.from(keys)],
        );
      } catch {
        // Soft-delete already committed; key cleanup is best-effort.
      }
    }

    return { message: 'Service soft-deleted successfully' };
  }

  async reorder(order: OrderItem[]): Promise<boolean> {
    return this.applyOrder(Service, order, 'service');
  }

  async reorderGroups(order: OrderItem[]): Promise<boolean> {
    return this.applyOrder(ServiceGroup, order, 'service group');
  }

  async reorderPillars(order: OrderItem[]): Promise<boolean> {
    return this.applyOrder(ServicePillar, order, 'service pillar');
  }

  // ── Groups ───────────────────────────────────────────────────────────
  async findGroups(pillar?: string): Promise<ServiceGroup[]> {
    const qb = this.groupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.pillarEntity', 'p')
      .where('g.is_deleted = :isDeleted', { isDeleted: false });

    if (pillar && pillar !== 'all') {
      qb.andWhere('(p.name = :pillar OR p.slug = :pillar OR g.pillar = :pillar)', { pillar });
    }

    return await qb
      .orderBy('p.display_order', 'ASC')
      .addOrderBy('g.display_order', 'ASC')
      .addOrderBy('g.name', 'ASC')
      .getMany();
  }

  async createGroup(dto: CreateServiceGroupDto): Promise<ServiceGroup> {
    const existing = await this.groupRepo.findOne({ where: { slug: dto.slug, is_deleted: false } });
    if (existing) {
      throw new ConflictException(`Group with slug "${dto.slug}" already exists`);
    }

    const pillar = await this.resolvePillar(dto.pillar);

    const group = this.groupRepo.create({
      pillar_id: pillar.id,
      pillar: pillar.name,
      name: dto.name,
      slug: dto.slug,
      display_order: dto.display_order ?? 0,
      is_active: dto.is_active ?? true,
    });

    return await this.groupRepo.save(group);
  }

  async updateGroup(id: number, dto: UpdateServiceGroupDto): Promise<ServiceGroup> {
    const group = await this.groupRepo.findOne({ where: { id, is_deleted: false } });
    if (!group) {
      throw new NotFoundException(`ServiceGroup with ID ${id} not found`);
    }

    if (dto.slug && dto.slug !== group.slug) {
      const existing = await this.groupRepo.findOne({ where: { slug: dto.slug, is_deleted: false } });
      if (existing) {
        throw new ConflictException(`Group with slug "${dto.slug}" already exists`);
      }
    }

    const pillar = dto.pillar ? await this.resolvePillar(dto.pillar) : null;

    // Moving a group between pillars carries its services with it, otherwise the
    // group and its children end up under different pillars — the same split the
    // FK was introduced to prevent.
    if (pillar && pillar.id !== group.pillar_id) {
      await this.serviceRepo
        .createQueryBuilder()
        .update(Service)
        .set({ pillar: pillar.name, pillar_id: pillar.id })
        .where('group_id = :id AND is_deleted = false', { id })
        .execute();
    }

    Object.assign(group, {
      ...(pillar ? { pillar: pillar.name, pillar_id: pillar.id } : {}),
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug } : {}),
      ...(dto.display_order !== undefined ? { display_order: dto.display_order } : {}),
      ...(dto.is_active !== undefined ? { is_active: dto.is_active } : {}),
    });

    return await this.groupRepo.save(group);
  }

  async toggleGroupStatus(id: number, is_active: boolean): Promise<ServiceGroup> {
    const group = await this.groupRepo.findOne({ where: { id, is_deleted: false } });
    if (!group) {
      throw new NotFoundException(`ServiceGroup with ID ${id} not found`);
    }
    group.is_active = is_active;
    return await this.groupRepo.save(group);
  }

  async removeGroup(id: number): Promise<{ message: string }> {
    const group = await this.groupRepo.findOne({ where: { id, is_deleted: false } });
    if (!group) {
      throw new NotFoundException(`ServiceGroup with ID ${id} not found`);
    }

    // Unassign services under this group so they don't block deletion. The
    // pillar is intentionally left in place: the services keep their tab, they
    // just surface under the client's "General Services" bucket.
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(Service)
        .set({ group_id: null })
        .where('group_id = :id AND is_deleted = false', { id })
        .execute();

      await manager.update(ServiceGroup, { id }, { is_deleted: true });
    });

    return { message: 'Service group soft-deleted successfully' };
  }

  // ── Stats ────────────────────────────────────────────────────────────
  // Aggregated in SQL. The previous version pulled every live service row into
  // memory and counted in JS, so the dashboard cost grew with the catalogue on
  // every page load.
  async getStats() {
    const totals = (await this.serviceRepo
      .createQueryBuilder('s')
      .select('COUNT(*)::int', 'total')
      .addSelect('COUNT(*) FILTER (WHERE s.is_active)::int', 'active')
      .where('s.is_deleted = :isDeleted', { isDeleted: false })
      .getRawOne()) as Record<string, number> | undefined;

    const total = Number(totals?.total ?? 0);
    const active = Number(totals?.active ?? 0);

    const byPillarRows = (await this.serviceRepo
      .createQueryBuilder('s')
      .leftJoin('s.pillarEntity', 'p')
      .select('COALESCE(p.name, s.pillar)', 'key')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.is_deleted = :isDeleted', { isDeleted: false })
      .groupBy('COALESCE(p.name, s.pillar)')
      .getRawMany()) as { key: string | null; count: number }[];

    const byGroupRows = (await this.serviceRepo
      .createQueryBuilder('s')
      .select('s.group_id', 'key')
      .addSelect('COUNT(*)::int', 'count')
      .where('s.is_deleted = :isDeleted AND s.group_id IS NOT NULL', { isDeleted: false })
      .groupBy('s.group_id')
      .getRawMany()) as { key: number; count: number }[];

    const groupCount = (await this.groupRepo
      .createQueryBuilder('g')
      .select('COUNT(*)::int', 'count')
      .where('g.is_deleted = :isDeleted', { isDeleted: false })
      .getRawOne()) as Record<string, number> | undefined;

    const pillarCount = (await this.pillarRepo
      .createQueryBuilder('p')
      .select('COUNT(*)::int', 'count')
      .where('p.is_deleted = :isDeleted', { isDeleted: false })
      .getRawOne()) as Record<string, number> | undefined;

    const byPillar: Record<string, number> = {};
    for (const row of byPillarRows) {
      if (row.key) byPillar[row.key] = Number(row.count);
    }

    const byGroup: Record<string, number> = {};
    for (const row of byGroupRows) {
      if (row.key != null) byGroup[String(row.key)] = Number(row.count);
    }

    return {
      total,
      active,
      inactive: total - active,
      totalGroups: Number(groupCount?.count ?? 0),
      totalPillars: Number(pillarCount?.count ?? 0),
      byPillar,
      byGroup,
    };
  }
}
