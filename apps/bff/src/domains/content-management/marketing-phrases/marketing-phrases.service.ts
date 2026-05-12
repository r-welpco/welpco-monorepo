import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketingPhrase, PhraseType } from '../entities/marketing-phrase.entity';

@Injectable()
export class MarketingPhrasesService {
  constructor(
    @InjectRepository(MarketingPhrase)
    private readonly repo: Repository<MarketingPhrase>,
  ) {}

  async findAll(phraseType?: PhraseType): Promise<MarketingPhrase[]> {
    const where = phraseType ? { phraseType } : {};
    return this.repo.find({ where, order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<MarketingPhrase> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`Marketing phrase ${id} not found`);
    return item;
  }

  async create(data: Partial<MarketingPhrase>): Promise<MarketingPhrase> {
    return this.repo.save(this.repo.create(data));
  }

  async update(id: string, data: Partial<MarketingPhrase>): Promise<MarketingPhrase> {
    const item = await this.findOne(id);
    Object.assign(item, data);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const item = await this.findOne(id);
    await this.repo.remove(item);
  }
}
