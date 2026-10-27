import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { CreateWhatWeDoDto } from './dto/create-what-we-do.dto';
import { ListWhatWeDoDto } from './dto/list-what-we-do.dto';
import { ReorderWhatWeDoDto } from './dto/reorder-what-we-do.dto';
import { UpdateWhatWeDoDto } from './dto/update-what-we-do.dto';
import { WhatWeDo } from './entities/what-we-do.entity';

@Injectable()
export class WhatWeDoService {
  constructor(
    @InjectRepository(WhatWeDo)
    private readonly repo: Repository<WhatWeDo>,
  ) {}

  async categories(): Promise<{ category: string }[]> {
    return this.repo
      .createQueryBuilder("what_we_do")
      .select("what_we_do.category", "category")
      .distinct(true)
      .where("what_we_do.is_deleted = :isDeleted", { isDeleted: false })
      .andWhere("TRIM(what_we_do.category) <> ''")
      .orderBy("what_we_do.category", "ASC")
      .getRawMany<{ category: string }>();
  }

  async findAllPublic(): Promise<WhatWeDo[]> {
    return this.repo.find({
      where: { is_available: true, is_deleted: false },
      order: { sort_order: "ASC", id: "ASC" },
    });
  }

  async findAll(query: ListWhatWeDoDto) {
    const requestedPage = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const search = query.search?.trim();
    const category = query.category?.trim();
    const qb = this.repo
      .createQueryBuilder("what_we_do")
      .where("what_we_do.is_deleted = :isDeleted", { isDeleted: false })
      .orderBy("what_we_do.category", "ASC")
      .addOrderBy("what_we_do.sort_order", "ASC")
      .addOrderBy("what_we_do.id", "ASC");

    if (search) {
      qb.andWhere(
        "(what_we_do.category ILIKE :search OR what_we_do.problem ILIKE :search OR what_we_do.problem_desc ILIKE :search OR what_we_do.solution ILIKE :search OR what_we_do.solution_desc ILIKE :search)",
        { search: `%${search}%` },
      );
    }
    if (category) {
      qb.andWhere("what_we_do.category = :category", { category });
    }

    const total = await qb.clone().getCount();
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const page = Math.min(requestedPage, totalPages);
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();
    const categoryOffsets: Record<string, number> = {};
    const firstByCategory = new Map<string, WhatWeDo>();
    for (const item of data) {
      if (!firstByCategory.has(item.category)) {
        firstByCategory.set(item.category, item);
      }
    }

    if (firstByCategory.size > 0) {
      const offsetQuery = this.repo
        .createQueryBuilder("what_we_do")
        .select("what_we_do.category", "category")
        .addSelect("COUNT(*)", "offset")
        .where("what_we_do.is_deleted = :isDeleted", { isDeleted: false })
        .andWhere(
          new Brackets((where) => {
            [...firstByCategory.values()].forEach((item, index) => {
              where.orWhere(
                `(what_we_do.category = :category${index} AND (what_we_do.sort_order < :sortOrder${index} OR (what_we_do.sort_order = :sortOrder${index} AND what_we_do.id < :id${index})))`,
                {
                  [`category${index}`]: item.category,
                  [`sortOrder${index}`]: item.sort_order,
                  [`id${index}`]: item.id,
                },
              );
            });
          }),
        )
        .groupBy("what_we_do.category");
      const offsets = await offsetQuery.getRawMany<{
        category: string;
        offset: string | number;
      }>();

      for (const entry of offsets) {
        categoryOffsets[entry.category] = Number(entry.offset);
      }
      for (const categoryName of firstByCategory.keys()) {
        categoryOffsets[categoryName] ??= 0;
      }
    }

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        categoryOffsets,
      },
    };
  }

  async findOne(id: number): Promise<WhatWeDo> {
    const item = await this.repo.findOneBy({ id, is_deleted: false });
    if (!item) throw new NotFoundException("What we do item not found");
    return item;
  }

  async create(data: CreateWhatWeDoDto[]) {
    const categories = [...new Set(data.map((item) => item.category))];
    const existing = categories.length
      ? await this.repo.find({
          where: { category: In(categories), is_deleted: false },
          select: ['category', 'sort_order'],
        })
      : [];
    const occupiedOrders = new Map<string, Set<number>>();

    for (const item of existing) {
      const orders = occupiedOrders.get(item.category) ?? new Set<number>();
      orders.add(item.sort_order);
      occupiedOrders.set(item.category, orders);
    }

    const adjustedOrders: {
      category: string;
      requestedSortOrder: number;
      assignedSortOrder: number;
    }[] = [];

    const rows = data.map((item) => {
      const orders = occupiedOrders.get(item.category) ?? new Set<number>();
      const requestedSortOrder = item.sort_order ?? 0;
      let assignedSortOrder = requestedSortOrder;

      while (orders.has(assignedSortOrder)) {
        assignedSortOrder += 1;
      }

      if (assignedSortOrder !== requestedSortOrder) {
        adjustedOrders.push({
          category: item.category,
          requestedSortOrder,
          assignedSortOrder,
        });
      }

      orders.add(assignedSortOrder);
      occupiedOrders.set(item.category, orders);
      return { ...item, sort_order: assignedSortOrder };
    });

    const created = await this.repo.save(this.repo.create(rows));
    return {
      data: created,
      message: adjustedOrders.length
        ? 'Sort order changed for overlapping entries.'
        : 'Entries created successfully.',
      adjustedOrders,
    };
  }

  async reorder(data: ReorderWhatWeDoDto): Promise<{ success: true }> {
    return this.repo.manager.transaction(async (manager) => {
      const repository = manager.getRepository(WhatWeDo);
      const items = await repository.find({
        where: { category: data.category, is_deleted: false },
        order: { sort_order: "ASC", id: "ASC" },
      });
      const ids = new Set(data.ids);
      const segment = items.slice(data.offset, data.offset + data.ids.length);

      if (
        ids.size !== data.ids.length ||
        segment.length !== data.ids.length ||
        segment.some((item) => !ids.has(item.id)) ||
        data.ids.some((id) => !segment.some((item) => item.id === id))
      ) {
        throw new BadRequestException(
          'Reorder must include exactly the visible items in this category range.',
        );
      }

      const itemsById = new Map(items.map((item) => [item.id, item]));
      const reorderedSegment = data.ids.map((id) => {
        const item = itemsById.get(id);
        if (!item) {
          throw new BadRequestException(
            'Item does not belong to this category.',
          );
        }
        return item;
      });
      const reorderedItems = [
        ...items.slice(0, data.offset),
        ...reorderedSegment,
        ...items.slice(data.offset + data.ids.length),
      ];

      const changedItems = reorderedItems
        .map((item, sortOrder) => ({ ...item, sort_order: sortOrder }))
        .filter(
          (item) =>
            itemsById.get(item.id)?.sort_order !== item.sort_order,
        );
      if (changedItems.length > 0) await repository.save(changedItems);
      return { success: true };
    });
  }

  async update(id: number, data: UpdateWhatWeDoDto) {
    const item = await this.findOne(id);
    const category = data.category ?? item.category;
    const requestedSortOrder = data.sort_order ?? item.sort_order;
    const existing = await this.repo.find({
      where: { category, is_deleted: false },
      select: ['id', 'sort_order'],
    });
    const occupiedOrders = new Set(
      existing
        .filter((entry) => entry.id !== id)
        .map((entry) => entry.sort_order),
    );
    let assignedSortOrder = requestedSortOrder;

    while (occupiedOrders.has(assignedSortOrder)) {
      assignedSortOrder += 1;
    }

    const updated = await this.repo.save({
      ...item,
      ...data,
      category,
      sort_order: assignedSortOrder,
    });
    const adjusted = assignedSortOrder !== requestedSortOrder;

    return {
      data: updated,
      message: adjusted
        ? 'Sort order changed because the requested category/order already exists.'
        : 'Entry updated successfully.',
      adjustedOrders: adjusted
        ? [
            {
              category,
              requestedSortOrder,
              assignedSortOrder,
            },
          ]
        : [],
    };
  }

  async remove(id: number): Promise<{ success: true }> {
    const item = await this.findOne(id);
    item.is_deleted = true;
    await this.repo.save(item);
    return { success: true };
  }
}
