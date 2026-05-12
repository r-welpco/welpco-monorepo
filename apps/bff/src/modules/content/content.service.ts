import { Injectable } from '@nestjs/common';
import { CategoriesService } from '../../domains/content-management/categories/categories.service';
import { HolidayService, HolidayQuery } from '../../domains/content-management/holiday/holiday.service';
import { QuestionsService } from '../../domains/content-management/questions/questions.service';
import { ServiceQuestionsService } from '../../domains/content-management/service-questions/service-questions.service';
import { StaticContentService } from '../../domains/content-management/static-content/static-content.service';
import { ContentType } from '../../domains/content-management/entities/static-content.entity';

@Injectable()
export class ContentService {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly holidayService: HolidayService,
    private readonly questionsService: QuestionsService,
    private readonly serviceQuestionsService: ServiceQuestionsService,
    private readonly staticContentService: StaticContentService,
  ) {}

  async getCategories(includeInactive = false) {
    return this.categoriesService.findAll(includeInactive);
  }

  async getCategory(id: string) {
    return this.categoriesService.findOne(id);
  }

  async getCategoriesByParent(parentId: string | null) {
    return this.categoriesService.findByParentId(parentId);
  }

  async getQuestions() {
    return this.questionsService.findAll();
  }

  async getQuestion(id: string) {
    return this.questionsService.findOne(id);
  }

  async getServiceQuestions(serviceCategoryId: string) {
    return this.serviceQuestionsService.findByServiceCategory(serviceCategoryId);
  }

  async getStaticContent(includeUnpublished = false) {
    return this.staticContentService.findAll(includeUnpublished);
  }

  async getStaticContentByType(contentType: string, includeUnpublished = false) {
    return this.staticContentService.findByType(
      contentType as ContentType,
      includeUnpublished,
    );
  }

  async getHolidays(query: HolidayQuery) {
    return this.holidayService.findByCountryAndProvince(query);
  }
}
