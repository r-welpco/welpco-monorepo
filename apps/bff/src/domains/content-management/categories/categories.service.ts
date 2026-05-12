import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ServiceCategory } from '../entities/service-category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { DiscoveryCategoriesCacheService } from '../../../common/discovery-categories-cache/discovery-categories-cache.service';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(ServiceCategory)
    private categoryRepository: Repository<ServiceCategory>,
    private readonly discoveryCategoriesCache: DiscoveryCategoriesCacheService,
  ) {}

  async findAll(includeInactive = false): Promise<ServiceCategory[]> {
    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children')
      .orderBy('category.displayOrder', 'ASC')
      .addOrderBy('category.name', 'ASC');

    if (!includeInactive) {
      query.where('category.isActive = :isActive', { isActive: true });
    }

    return query.getMany();
  }

  async findOne(id: string): Promise<ServiceCategory> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async findByParentId(parentId: string | null): Promise<ServiceCategory[]> {
    return this.categoryRepository.find({
      where: { parentId: parentId === null ? IsNull() : parentId, isActive: true },
      relations: ['parent', 'children'],
      order: { displayOrder: 'ASC', name: 'ASC' },
    });
  }

  async create(createDto: CreateCategoryDto): Promise<ServiceCategory> {
    let level: number;
    if (createDto.parentId) {
      const parent = await this.categoryRepository.findOne({
        where: { id: createDto.parentId },
      });
      if (!parent) {
        throw new BadRequestException(
          `Parent category with ID ${createDto.parentId} not found`,
        );
      }
      level = parent.level + 1;
    } else {
      level = 1;
    }

    const category = this.categoryRepository.create({
      name: createDto.name,
      description: createDto.description ?? null,
      parentId: createDto.parentId ?? null,
      level,
      displayOrder: createDto.displayOrder ?? 0,
      icon: createDto.icon ?? null,
      isActive: createDto.isActive ?? true,
    });

    const saved = await this.categoryRepository.save(category);
    this.discoveryCategoriesCache.invalidate();
    return saved;
  }

  async update(
    id: string,
    updateDto: UpdateCategoryDto,
  ): Promise<ServiceCategory> {
    const category = await this.findOne(id);

    // Validate parent exists if being updated + check for circular references
    if (updateDto.parentId !== undefined) {
      if (updateDto.parentId === category.id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      if (updateDto.parentId) {
        const parent = await this.categoryRepository.findOne({
          where: { id: updateDto.parentId },
        });
        if (!parent) {
          throw new BadRequestException(
            `Parent category with ID ${updateDto.parentId} not found`,
          );
        }

        // Walk the ancestor chain to detect cycles (e.g. A→B→C, setting C.parent=A)
        let ancestor: ServiceCategory | null = parent;
        const visited = new Set<string>([category.id]);
        while (ancestor) {
          if (visited.has(ancestor.id)) {
            throw new BadRequestException(
              'Cannot set parent: this would create a circular category hierarchy',
            );
          }
          visited.add(ancestor.id);
          ancestor = ancestor.parentId
            ? await this.categoryRepository.findOne({ where: { id: ancestor.parentId } })
            : null;
        }

        category.level = parent.level + 1;
      } else {
        category.level = 1;
      }
    }

    Object.assign(category, updateDto);
    const saved = await this.categoryRepository.save(category);
    this.discoveryCategoriesCache.invalidate();
    return saved;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has children
    const children = await this.categoryRepository.find({
      where: { parentId: id },
    });
    if (children.length > 0) {
      throw new BadRequestException(
        'Cannot delete category with subcategories. Delete or move subcategories first.',
      );
    }

    await this.categoryRepository.remove(category);
    this.discoveryCategoriesCache.invalidate();
  }
}
