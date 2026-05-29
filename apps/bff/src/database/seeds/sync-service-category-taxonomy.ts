import { DataSource, IsNull } from 'typeorm';
import {
  Question,
  QuestionType,
  ServiceCategory,
  ServiceQuestion,
} from '../../domains/content-management/entities';
import { ServiceOffering } from '../../domains/profile-management/entities/service-offering.entity';
import {
  getTaxonomyNameSet,
  REMOVED_SUBCATEGORY_OFFERING_TARGET,
  SERVICE_CATEGORY_TAXONOMY,
} from './service-category-taxonomy';

/**
 * Idempotently upserts the canonical category taxonomy and deactivates legacy
 * categories not in the taxonomy list. Attaches a minimal generic question set
 * to any new subcategory that has none.
 */
export async function syncServiceCategoryTaxonomy(
  dataSource: DataSource,
): Promise<void> {
  const categoryRepo = dataSource.getRepository(ServiceCategory);
  const questionRepo = dataSource.getRepository(Question);
  const serviceQuestionRepo = dataSource.getRepository(ServiceQuestion);

  const allowedNames = getTaxonomyNameSet();
  let parentOrder = 0;

  for (const parentDef of SERVICE_CATEGORY_TAXONOMY) {
    parentOrder += 1;
    let parent = await categoryRepo.findOne({
      where: { name: parentDef.name, level: 1, parentId: IsNull() },
    });
    if (!parent) {
      parent = categoryRepo.create({
        name: parentDef.name,
        description: parentDef.description,
        parentId: null,
        level: 1,
        displayOrder: parentOrder,
        isActive: true,
      });
    } else {
      parent.description = parentDef.description;
      parent.displayOrder = parentOrder;
      parent.isActive = true;
    }
    parent = await categoryRepo.save(parent);

    let subOrder = 0;
    for (const subDef of parentDef.subcategories) {
      subOrder += 1;
      let sub = await categoryRepo.findOne({
        where: { name: subDef.name, level: 2, parentId: parent.id },
      });
      if (!sub) {
        sub = categoryRepo.create({
          name: subDef.name,
          description: subDef.description ?? `${subDef.name} services`,
          parentId: parent.id,
          level: 2,
          displayOrder: subOrder,
          isActive: true,
        });
      } else {
        sub.description = subDef.description ?? sub.description;
        sub.parentId = parent.id;
        sub.displayOrder = subOrder;
        sub.isActive = true;
      }
      await categoryRepo.save(sub);
    }
  }

  const allCategories = await categoryRepo.find();
  const categoryByName = new Map(allCategories.map((c) => [c.name, c]));
  for (const cat of allCategories) {
    if (!allowedNames.has(cat.name)) {
      cat.isActive = false;
      await categoryRepo.save(cat);
    }
  }

  await migrateOfferingsFromRemovedSubcategories(dataSource, categoryByName);

  const existingQuestions = await questionRepo.find({ take: 1 });
  if (existingQuestions.length === 0) {
    return;
  }

  const dateNeeded = await questionRepo.findOne({ where: { label: 'Date needed' } });
  const timeQ = await questionRepo.findOne({ where: { label: 'Time' } });
  const payPerHour = await questionRepo.findOne({
    where: { label: 'Pay per hour' },
  });
  const notes = await questionRepo.findOne({ where: { label: 'Notes' } });
  if (!dateNeeded || !timeQ || !payPerHour || !notes) {
    return;
  }

  const genericLinks = [
    { questionId: dateNeeded.id, displayOrder: 1, required: true },
    { questionId: timeQ.id, displayOrder: 2, required: true },
    { questionId: payPerHour.id, displayOrder: 3, required: true },
    { questionId: notes.id, displayOrder: 4, required: false },
  ];

  const activeSubs = await categoryRepo.find({
    where: { level: 2, isActive: true },
  });
  for (const sub of activeSubs) {
    const count = await serviceQuestionRepo.count({
      where: { serviceCategoryId: sub.id },
    });
    if (count > 0) continue;
    for (const link of genericLinks) {
      const row = serviceQuestionRepo.create({
        serviceCategoryId: sub.id,
        questionId: link.questionId,
        displayOrder: link.displayOrder,
        isRequired: link.required,
        conditionalLogic: null,
      });
      await serviceQuestionRepo.save(row);
    }
  }
}

async function migrateOfferingsFromRemovedSubcategories(
  dataSource: DataSource,
  categoryByName: Map<string, ServiceCategory>,
): Promise<void> {
  const offeringRepo = dataSource.getRepository(ServiceOffering);
  let migrated = 0;

  for (const [fromName, toName] of Object.entries(REMOVED_SUBCATEGORY_OFFERING_TARGET)) {
    const from = categoryByName.get(fromName);
    const to = categoryByName.get(toName);
    if (!from || !to || from.id === to.id) continue;

    const result = await offeringRepo.update(
      { serviceCategoryId: from.id },
      { serviceCategoryId: to.id },
    );
    migrated += result.affected ?? 0;
  }

  if (migrated > 0) {
    console.log(`   ↪ Migrated ${migrated} service offering(s) from removed subcategories.`);
  }
}
