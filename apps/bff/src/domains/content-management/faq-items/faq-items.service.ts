import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FAQItem, FAQCategory } from '../entities/faq-item.entity';

@Injectable()
export class FaqItemsService {
  constructor(
    @InjectRepository(FAQItem)
    private readonly repo: Repository<FAQItem>,
  ) {}

  async findAll(category?: FAQCategory): Promise<FAQItem[]> {
    const where = category ? { category } : {};
    return this.repo.find({ where, order: { displayOrder: 'ASC' } });
  }

  async findOne(id: string): Promise<FAQItem> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`FAQ item ${id} not found`);
    return item;
  }

  async create(data: Partial<FAQItem>): Promise<FAQItem> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<FAQItem>): Promise<FAQItem> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
