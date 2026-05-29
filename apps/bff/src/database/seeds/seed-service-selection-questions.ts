import { DataSource, Repository } from 'typeorm';
import {
  Question,
  QuestionType,
  ServiceCategory,
  ServiceQuestion,
} from '../../domains/content-management/entities';
import { syncServiceCategoryTaxonomy } from './sync-service-category-taxonomy';
import {
  getTaxonomyNameSet,
  SERVICE_CATEGORY_TAXONOMY,
} from './service-category-taxonomy';
import {
  MARKDOWN_DOC_SUBCATEGORY_NAMES,
  SERVICE_SELECTION_SUBCATEGORY_QUESTIONS,
  type ServiceSelectionQuestionDef,
} from './service-selection-question-definitions';

function questionSignature(def: ServiceSelectionQuestionDef): string {
  const optionsKey = def.options?.map((o) => o.value).join(',') ?? '';
  return `${def.type}|${def.label}|${optionsKey}`;
}

/**
 * Reports differences between the EN service-selection doc and SERVICE_CATEGORY_TAXONOMY.
 */
export function printServiceSelectionTaxonomyDiff(): void {
  const taxonomySubs = new Set<string>();
  for (const parent of SERVICE_CATEGORY_TAXONOMY) {
    for (const sub of parent.subcategories) {
      taxonomySubs.add(sub.name);
    }
  }

  const docSubs = new Set<string>(MARKDOWN_DOC_SUBCATEGORY_NAMES);
  const seededSubs = new Set(
    SERVICE_SELECTION_SUBCATEGORY_QUESTIONS.map((s) => s.subcategoryName),
  );

  const inDocNotTaxonomy = [...docSubs].filter((n) => !taxonomySubs.has(n));
  const inTaxonomyNotDoc = [...taxonomySubs].filter((n) => !docSubs.has(n));
  const inTaxonomyNotSeeded = [...taxonomySubs].filter((n) => !seededSubs.has(n));
  const inSeededNotTaxonomy = [...seededSubs].filter((n) => !taxonomySubs.has(n));

  console.log('\n📋 Service selection doc vs taxonomy');
  if (inDocNotTaxonomy.length > 0) {
    console.log('   In EN doc but NOT in taxonomy:', inDocNotTaxonomy.join(', ') || '(none)');
  } else {
    console.log('   In EN doc but NOT in taxonomy: (none)');
  }
  if (inTaxonomyNotDoc.length > 0) {
    console.log('   In taxonomy but NOT in EN doc:', inTaxonomyNotDoc.join(', '));
  } else {
    console.log('   In taxonomy but NOT in EN doc: (none)');
  }
  if (inTaxonomyNotSeeded.length > 0) {
    console.log('   In taxonomy but missing question definitions:', inTaxonomyNotSeeded.join(', '));
  }
  if (inSeededNotTaxonomy.length > 0) {
    console.log('   Question definitions for unknown subcategories:', inSeededNotTaxonomy.join(', '));
  }
  console.log('   Note: EN doc uses "Pet-sitting"; taxonomy uses "Pet Sitting".');
}

async function findOrCreateQuestion(
  questionRepo: Repository<Question>,
  def: ServiceSelectionQuestionDef,
  cache: Map<string, Question>,
): Promise<Question> {
  const key = questionSignature(def);
  const cached = cache.get(key);
  if (cached) return cached;

  const existing = await questionRepo.findOne({
    where: { label: def.label, type: def.type },
  });
  if (existing) {
    let dirty = false;
    if (def.placeholder !== undefined && existing.placeholder !== def.placeholder) {
      existing.placeholder = def.placeholder ?? null;
      dirty = true;
    }
    if (def.helpText !== undefined && existing.helpText !== def.helpText) {
      existing.helpText = def.helpText ?? null;
      dirty = true;
    }
    if (def.options !== undefined) {
      existing.options = def.options;
      dirty = true;
    }
    if (def.entityType !== undefined && existing.entityType !== def.entityType) {
      existing.entityType = def.entityType;
      dirty = true;
    }
    if (def.validationRules !== undefined) {
      existing.validationRules = def.validationRules;
      dirty = true;
    }
    const saved = dirty ? await questionRepo.save(existing) : existing;
    cache.set(key, saved);
    return saved;
  }

  const row = questionRepo.create({
    type: def.type,
    label: def.label,
    placeholder: def.placeholder ?? null,
    helpText: def.helpText ?? null,
    validationRules: def.validationRules ?? null,
    options: def.options ?? null,
    entityType: def.entityType ?? null,
    displayOrder: 0,
  });
  const saved = await questionRepo.save(row);
  cache.set(key, saved);
  return saved;
}

export interface SeedServiceSelectionQuestionsOptions {
  /** When true, removes existing service_question links for each targeted subcategory before inserting. Default true. */
  replaceLinks?: boolean;
  /** When true, syncs SERVICE_CATEGORY_TAXONOMY before seeding. Default true. */
  syncTaxonomy?: boolean;
}

/**
 * Inserts booking-detail questions from Service selection pages — EN.md.
 * Questions attach only to level-2 subcategories (see README-SERVICE-QUESTIONS.md).
 */
export async function seedServiceSelectionQuestions(
  dataSource: DataSource,
  options: SeedServiceSelectionQuestionsOptions = {},
): Promise<void> {
  const { replaceLinks = true, syncTaxonomy = true } = options;

  const categoryRepo = dataSource.getRepository(ServiceCategory);
  const questionRepo = dataSource.getRepository(Question);
  const serviceQuestionRepo = dataSource.getRepository(ServiceQuestion);

  console.log('🌱 Seeding service selection questions...');
  printServiceSelectionTaxonomyDiff();

  if (syncTaxonomy) {
    await syncServiceCategoryTaxonomy(dataSource);
  }

  const allowedNames = getTaxonomyNameSet();
  const questionCache = new Map<string, Question>();
  let linkedCount = 0;
  let skippedUnknown = 0;

  for (const subDef of SERVICE_SELECTION_SUBCATEGORY_QUESTIONS) {
    if (!allowedNames.has(subDef.subcategoryName)) {
      console.warn(`   ⚠️  Skipping unknown subcategory: ${subDef.subcategoryName}`);
      skippedUnknown += 1;
      continue;
    }

    const sub = await categoryRepo.findOne({
      where: { name: subDef.subcategoryName, level: 2, isActive: true },
    });
    if (!sub) {
      console.warn(`   ⚠️  Active subcategory not found: ${subDef.subcategoryName}`);
      skippedUnknown += 1;
      continue;
    }

    if (replaceLinks) {
      await serviceQuestionRepo.delete({ serviceCategoryId: sub.id });
    }

    let order = 0;
    for (const qDef of subDef.questions) {
      order += 1;
      const question = await findOrCreateQuestion(questionRepo, qDef, questionCache);
      const isRequired = qDef.required !== false;
      await serviceQuestionRepo.save(
        serviceQuestionRepo.create({
          serviceCategoryId: sub.id,
          questionId: question.id,
          displayOrder: order,
          isRequired,
          conditionalLogic: null,
        }),
      );
      linkedCount += 1;
    }
    console.log(`   ✅ ${subDef.subcategoryName}: ${subDef.questions.length} questions`);
  }

  const activeSubs = await categoryRepo.find({
    where: { level: 2, isActive: true },
    order: { displayOrder: 'ASC' },
  });
  const missing: string[] = [];
  for (const sub of activeSubs) {
    const count = await serviceQuestionRepo.count({ where: { serviceCategoryId: sub.id } });
    if (count === 0) missing.push(sub.name);
  }

  console.log(`\n   Linked ${linkedCount} service_question rows (${questionCache.size} unique questions).`);
  if (skippedUnknown > 0) {
    console.log(`   Skipped ${skippedUnknown} subcategory definition(s).`);
  }
  if (missing.length > 0) {
    throw new Error(
      `Subcategories still without questions: ${missing.join(', ')}. Add definitions in service-selection-question-definitions.ts.`,
    );
  }
  console.log(`   ✅ All ${activeSubs.length} active subcategories have questions.`);
}
