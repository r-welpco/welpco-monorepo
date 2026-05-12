import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StaticContent, ContentType } from '../entities/static-content.entity';
import { CreateStaticContentDto } from './dto/create-static-content.dto';
import { UpdateStaticContentDto } from './dto/update-static-content.dto';

@Injectable()
export class StaticContentService {
  constructor(
    @InjectRepository(StaticContent)
    private staticContentRepository: Repository<StaticContent>,
  ) {}

  async findAll(includeUnpublished = false): Promise<StaticContent[]> {
    const query = this.staticContentRepository
      .createQueryBuilder('content')
      .orderBy('content.contentType', 'ASC')
      .addOrderBy('content.version', 'DESC');

    if (!includeUnpublished) {
      query.where('content.isPublished = :isPublished', { isPublished: true });
    }

    return query.getMany();
  }

  async findByType(
    contentType: ContentType,
    includeUnpublished = false,
  ): Promise<StaticContent | null> {
    const query = this.staticContentRepository
      .createQueryBuilder('content')
      .where('content.contentType = :contentType', { contentType })
      .orderBy('content.version', 'DESC')
      .limit(1);

    if (!includeUnpublished) {
      query.andWhere('content.isPublished = :isPublished', {
        isPublished: true,
      });
    }

    return query.getOne();
  }

  async findOne(id: string): Promise<StaticContent> {
    const content = await this.staticContentRepository.findOne({
      where: { id },
    });

    if (!content) {
      throw new NotFoundException(`Static content with ID ${id} not found`);
    }

    return content;
  }

  async create(createDto: CreateStaticContentDto): Promise<StaticContent> {
    // Check if content of this type already exists
    const existing = await this.staticContentRepository.findOne({
      where: { contentType: createDto.contentType },
      order: { version: 'DESC' },
    });

    const version = existing ? existing.version + 1 : 1;

    const content = this.staticContentRepository.create({
      contentType: createDto.contentType,
      title: createDto.title,
      body: createDto.body,
      version,
      isPublished: createDto.isPublished ?? true,
      publishedDate: createDto.publishedDate ?? new Date(),
    });

    return this.staticContentRepository.save(content);
  }

  async update(
    id: string,
    updateDto: UpdateStaticContentDto,
  ): Promise<StaticContent> {
    const content = await this.findOne(id);

    Object.assign(content, updateDto);
    return this.staticContentRepository.save(content);
  }

  async remove(id: string): Promise<void> {
    const content = await this.findOne(id);
    await this.staticContentRepository.remove(content);
  }
}
