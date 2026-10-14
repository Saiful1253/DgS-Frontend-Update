import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientLogo } from './client-logo.entity';

@Injectable()
export class ClientLogosService {
  constructor(
    @InjectRepository(ClientLogo)
    private repo: Repository<ClientLogo>,
  ) {}

  async findAllPublic() {
    return this.repo.find({
      where: { status: 'active', is_deleted: false },
      order: { display_order: 'ASC', id: 'ASC' },
    });
  }

  async findAll() {
    return this.repo.find({
      where: { is_deleted: false },
      order: { display_order: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number) {
    const item = await this.repo.findOneBy({ id });
    if (!item || item.is_deleted) throw new NotFoundException('Client logo not found');
    return item;
  }

  async create(data: Partial<ClientLogo>) {
    const item = this.repo.create(data);
    return this.repo.save(item);
  }

  async update(id: number, data: Partial<ClientLogo>) {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: number) {
    const item = await this.findOne(id);
    item.is_deleted = true;
    await this.repo.save(item);
    return { success: true };
  }

  async reorder(order: { id: number; display_order: number }[]) {
    for (const item of order) {
      await this.repo.update(item.id, { display_order: item.display_order });
    }
    return this.findAll();
  }
}