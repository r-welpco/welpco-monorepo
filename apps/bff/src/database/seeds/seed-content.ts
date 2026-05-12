import { DataSource } from 'typeorm';
import {
  ServiceCategory,
  Question,
  ServiceQuestion,
  QuestionType,
  EntityType,
  StaticContent,
  ContentType,
  FAQItem,
  FAQCategory,
  MarketingPhrase,
  PhraseType,
} from '../../domains/content-management/entities';

/**
 * Seeds all content-management data: categories, questions, service_questions,
 * static content, FAQ items, and marketing phrases.
 */
export async function seedContent(dataSource: DataSource): Promise<void> {
  const categoryRepository = dataSource.getRepository(ServiceCategory);
  const questionRepository = dataSource.getRepository(Question);
  const serviceQuestionRepository = dataSource.getRepository(ServiceQuestion);
  const staticContentRepository = dataSource.getRepository(StaticContent);
  const faqRepository = dataSource.getRepository(FAQItem);
  const marketingRepository = dataSource.getRepository(MarketingPhrase);

  console.log('🌱 Seeding content (categories, questions, static, FAQ, marketing)...');

  const hasContent =
    (await categoryRepository.count()) +
      (await staticContentRepository.count()) +
      (await faqRepository.count()) +
      (await marketingRepository.count()) >
    0;

  if (hasContent) {
    console.log('   Content already present; skipping content seed (run with CLEAR_CONTENT=1 to replace).');
    if (process.env.CLEAR_CONTENT !== '1') {
      return;
    }
    await serviceQuestionRepository.delete({});
    await questionRepository.delete({});
    await categoryRepository.delete({});
    await staticContentRepository.delete({});
    await faqRepository.delete({});
    await marketingRepository.delete({});
  }

  // —— Categories (level 1) ——
  const careCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Care',
      description: 'Childcare, elderly care, and special needs services',
      parentId: null,
      level: 1,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const petCareCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Pet Care',
      description: 'Pet-related services including dog walking, grooming, and training',
      parentId: null,
      level: 1,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const educationCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Education',
      description: 'Tutoring and music lessons',
      parentId: null,
      level: 1,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const inHomeMaintenanceCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'In-Home Maintenance',
      description: 'Housekeeping, painting, organizing, moving, and installation services',
      parentId: null,
      level: 1,
      displayOrder: 4,
      isActive: true,
    }),
  );
  const exteriorMaintenanceCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Exterior Maintenance',
      description: 'Lawn care, gardening, car washing, and seasonal maintenance',
      parentId: null,
      level: 1,
      displayOrder: 5,
      isActive: true,
    }),
  );
  const healthWellnessCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Health & Wellness',
      description: 'Meal preparation, personal training, and nutrition services',
      parentId: null,
      level: 1,
      displayOrder: 6,
      isActive: true,
    }),
  );
  const entertainmentCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Entertainment',
      description: 'Catering, party planning, and event services',
      parentId: null,
      level: 1,
      displayOrder: 7,
      isActive: true,
    }),
  );

  // —— Subcategories ——
  const babysitterCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Babysitter',
      description: 'Babysitting services',
      parentId: careCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const childCareCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Child Care',
      description: 'Child care services',
      parentId: careCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const elderlyCareCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Elderly Care',
      description: 'Elderly care services',
      parentId: careCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const specialNeedsCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Special Needs',
      description: 'Special needs care services',
      parentId: careCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );
  const dogWalksCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Dog Walks',
      description: 'Dog walking services',
      parentId: petCareCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const petGroomingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Pet Grooming',
      description: 'Pet grooming services',
      parentId: petCareCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const aquariumTerrariumCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Aquarium and Terrarium Cleaning/Maintenance',
      description: 'Aquarium and terrarium cleaning and maintenance services',
      parentId: petCareCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const dogTrainingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Dog Training',
      description: 'Dog training services',
      parentId: petCareCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );
  const petSittingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Pet-sitting',
      description: 'Pet sitting services',
      parentId: petCareCategory.id,
      level: 2,
      displayOrder: 5,
      isActive: true,
    }),
  );
  const tutoringCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Tutoring',
      description: 'Tutoring services',
      parentId: educationCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const musicLessonsCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Music Lessons',
      description: 'Music lesson services',
      parentId: educationCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const cateringCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Catering',
      description: 'Catering services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const partyPlanningCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Party-planning',
      description: 'Party planning services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const magicianCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Magician',
      description: 'Magician services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const clownCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Clown',
      description: 'Clown services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );
  const serverCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Server',
      description: 'Server services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 5,
      isActive: true,
    }),
  );
  const assistantForPartyCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Assistant for Party',
      description: 'Party assistant services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 6,
      isActive: true,
    }),
  );
  const bartenderCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Bartender',
      description: 'Bartender services',
      parentId: entertainmentCategory.id,
      level: 2,
      displayOrder: 7,
      isActive: true,
    }),
  );
  const mealPreparationCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Meal Preparation',
      description: 'Meal preparation services',
      parentId: healthWellnessCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const personalTrainerCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Personal Trainer',
      description: 'Personal training services',
      parentId: healthWellnessCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const dieticianCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Dietician',
      description: 'Dietician services',
      parentId: healthWellnessCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const nutritionistCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Nutritionist',
      description: 'Nutritionist services',
      parentId: healthWellnessCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );
  // In-Home Maintenance subcategories (questions attach only to subcategories)
  const housekeepingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Housekeeping',
      description: 'Housekeeping and cleaning services',
      parentId: inHomeMaintenanceCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const paintingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Painting',
      description: 'Interior and exterior painting',
      parentId: inHomeMaintenanceCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const organizingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Organizing',
      description: 'Home organizing and decluttering',
      parentId: inHomeMaintenanceCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const movingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Moving',
      description: 'Moving and relocation help',
      parentId: inHomeMaintenanceCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );
  const installationCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Installation',
      description: 'Furniture and equipment installation',
      parentId: inHomeMaintenanceCategory.id,
      level: 2,
      displayOrder: 5,
      isActive: true,
    }),
  );
  // Exterior Maintenance subcategories
  const lawnCareCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Lawn Care',
      description: 'Lawn mowing and lawn care services',
      parentId: exteriorMaintenanceCategory.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    }),
  );
  const gardeningCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Gardening',
      description: 'Gardening and landscaping services',
      parentId: exteriorMaintenanceCategory.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    }),
  );
  const carWashingCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Car Washing',
      description: 'Car washing and detailing',
      parentId: exteriorMaintenanceCategory.id,
      level: 2,
      displayOrder: 3,
      isActive: true,
    }),
  );
  const seasonalMaintenanceCategory = await categoryRepository.save(
    categoryRepository.create({
      name: 'Seasonal Maintenance',
      description: 'Seasonal outdoor maintenance',
      parentId: exteriorMaintenanceCategory.id,
      level: 2,
      displayOrder: 4,
      isActive: true,
    }),
  );

  // —— Questions (shared) ——
  const dateNeededQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.DATE,
      label: 'Date needed',
      placeholder: 'Select date',
      displayOrder: 1,
    }),
  );
  const timeQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.TIME,
      label: 'Time',
      placeholder: 'Select time',
      displayOrder: 2,
    }),
  );
  const oneTimeOrRecurringQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.CHOICE,
      label: 'One time or recurring?',
      placeholder: 'Choose one',
      options: [
        { value: 'one-time', label: 'One time' },
        { value: 'recurring', label: 'Recurring' },
      ],
      displayOrder: 3,
    }),
  );
  const recurringFrequencyQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.CHOICE,
      label: 'If recurring, choose',
      placeholder: 'Select frequency',
      options: [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'bi-weekly', label: 'Bi-weekly' },
      ],
      displayOrder: 4,
    }),
  );
  const payPerHourQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'Pay per hour',
      placeholder: 'Enter amount',
      validationRules: { required: true, min: 0 },
      displayOrder: 5,
    }),
  );
  const notesQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.TEXT,
      label: 'Notes',
      placeholder: 'Additional notes',
      displayOrder: 6,
    }),
  );
  const addChildQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.ENTITY_REFERENCE,
      label: 'Who needs babysitting?',
      entityType: EntityType.CHILD,
      displayOrder: 0,
    }),
  );
  const addPersonQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.ENTITY_REFERENCE,
      label: 'Who needs care?',
      entityType: EntityType.PERSON,
      displayOrder: 0,
    }),
  );
  const howManyDogsQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'How many dogs?',
      placeholder: 'Enter number',
      validationRules: { required: true, min: 1 },
      displayOrder: 1,
    }),
  );
  const dogSizeQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.CHOICE,
      label: 'Size of each dog',
      placeholder: 'Select size',
      options: [
        { value: 'small', label: 'Small' },
        { value: 'medium', label: 'Medium' },
        { value: 'large', label: 'Large' },
      ],
      displayOrder: 2,
    }),
  );
  const typeOfPetQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.TEXT,
      label: 'Type of pet?',
      placeholder: 'Enter pet type',
      displayOrder: 1,
    }),
  );
  const estimatedStartDateQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.DATE,
      label: 'Estimated Start date',
      placeholder: 'Select date',
      displayOrder: 1,
    }),
  );
  const estimatedEndDateQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.DATE,
      label: 'Estimated End date',
      placeholder: 'Select date',
      displayOrder: 2,
    }),
  );
  const approximateSizeQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.TEXT,
      label: 'Approximate size of Terrarium',
      placeholder: 'Enter size',
      displayOrder: 1,
    }),
  );
  const howManyPeopleQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'How many people?',
      placeholder: 'Enter number',
      validationRules: { required: true, min: 1 },
      displayOrder: 1,
    }),
  );
  const agesOfEachPersonQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.ENTITY_REFERENCE,
      label: 'Ages of each person',
      entityType: EntityType.PERSON,
      displayOrder: 2,
    }),
  );
  const howManyDaysQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'How many days?',
      placeholder: 'Enter number',
      validationRules: { required: true, min: 1 },
      displayOrder: 3,
    }),
  );
  const howManyMealsPerDayQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'How many meals per day?',
      placeholder: 'Enter number',
      validationRules: { required: true, min: 1 },
      displayOrder: 4,
    }),
  );
  const eventForQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.CHOICE,
      label: 'Is the event for',
      placeholder: 'Choose one',
      options: [
        { value: 'adults', label: 'Adults' },
        { value: 'children', label: 'Children' },
        { value: 'family', label: 'Family' },
      ],
      validationRules: { required: true },
      displayOrder: 1,
    }),
  );
  const howManyAttendingQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.NUMBER,
      label: 'How many people are attending the event?',
      placeholder: 'Enter number',
      validationRules: { required: true, min: 1 },
      displayOrder: 2,
    }),
  );
  const whatDoYouNeedQuestion = await questionRepository.save(
    questionRepository.create({
      type: QuestionType.TEXT,
      label: 'What do you need for your event?',
      placeholder: 'Describe your needs',
      displayOrder: 0,
    }),
  );

  const link = (catId: string, qId: string, order: number, required: boolean, conditional?: ServiceQuestion['conditionalLogic']) =>
    serviceQuestionRepository.save(
      serviceQuestionRepository.create({
        serviceCategoryId: catId,
        questionId: qId,
        displayOrder: order,
        isRequired: required,
        conditionalLogic: conditional ?? null,
      }),
    );
  const recurringConditional = {
    showIf: { questionId: oneTimeOrRecurringQuestion.id, value: 'recurring' as const },
  };

  // Babysitter + Child Care
  for (const cat of [babysitterCategory, childCareCategory]) {
    await link(cat.id, addChildQuestion.id, 1, true);
    await link(cat.id, dateNeededQuestion.id, 2, true);
    await link(cat.id, timeQuestion.id, 3, true);
    await link(cat.id, oneTimeOrRecurringQuestion.id, 4, true);
    await link(cat.id, recurringFrequencyQuestion.id, 5, false, recurringConditional);
    await link(cat.id, payPerHourQuestion.id, 6, true);
    await link(cat.id, notesQuestion.id, 7, false);
  }
  // Elderly Care + Special Needs (person)
  for (const cat of [elderlyCareCategory, specialNeedsCategory]) {
    await link(cat.id, addPersonQuestion.id, 1, true);
    await link(cat.id, dateNeededQuestion.id, 2, true);
    await link(cat.id, timeQuestion.id, 3, true);
    await link(cat.id, oneTimeOrRecurringQuestion.id, 4, true);
    await link(cat.id, recurringFrequencyQuestion.id, 5, false, recurringConditional);
    await link(cat.id, payPerHourQuestion.id, 6, true);
    await link(cat.id, notesQuestion.id, 7, false);
  }
  // Dog Walks
  await link(dogWalksCategory.id, howManyDogsQuestion.id, 1, true);
  await link(dogWalksCategory.id, dogSizeQuestion.id, 2, true);
  await link(dogWalksCategory.id, estimatedStartDateQuestion.id, 3, true);
  await link(dogWalksCategory.id, dateNeededQuestion.id, 4, true);
  await link(dogWalksCategory.id, timeQuestion.id, 5, true);
  await link(dogWalksCategory.id, oneTimeOrRecurringQuestion.id, 6, true);
  await link(dogWalksCategory.id, recurringFrequencyQuestion.id, 7, false, recurringConditional);
  await link(dogWalksCategory.id, payPerHourQuestion.id, 8, true);
  await link(dogWalksCategory.id, notesQuestion.id, 9, false);
  // Pet Grooming
  await link(petGroomingCategory.id, typeOfPetQuestion.id, 1, true);
  await link(petGroomingCategory.id, estimatedStartDateQuestion.id, 2, true);
  await link(petGroomingCategory.id, dateNeededQuestion.id, 3, true);
  await link(petGroomingCategory.id, timeQuestion.id, 4, true);
  await link(petGroomingCategory.id, oneTimeOrRecurringQuestion.id, 5, true);
  await link(petGroomingCategory.id, recurringFrequencyQuestion.id, 6, false, recurringConditional);
  await link(petGroomingCategory.id, payPerHourQuestion.id, 7, true);
  await link(petGroomingCategory.id, notesQuestion.id, 8, false);
  // Meal Preparation
  await link(mealPreparationCategory.id, howManyPeopleQuestion.id, 1, true);
  await link(mealPreparationCategory.id, agesOfEachPersonQuestion.id, 2, true);
  await link(mealPreparationCategory.id, howManyDaysQuestion.id, 3, true);
  await link(mealPreparationCategory.id, howManyMealsPerDayQuestion.id, 4, true);
  await link(mealPreparationCategory.id, estimatedStartDateQuestion.id, 5, true);
  await link(mealPreparationCategory.id, estimatedEndDateQuestion.id, 6, true);
  await link(mealPreparationCategory.id, payPerHourQuestion.id, 7, true);
  await link(mealPreparationCategory.id, notesQuestion.id, 8, false);
  // Entertainment
  const entertainmentServices = [
    cateringCategory,
    partyPlanningCategory,
    magicianCategory,
    clownCategory,
    serverCategory,
    assistantForPartyCategory,
    bartenderCategory,
  ];
  for (const service of entertainmentServices) {
    await link(service.id, whatDoYouNeedQuestion.id, 0, true);
    await link(service.id, eventForQuestion.id, 1, true);
    await link(service.id, howManyAttendingQuestion.id, 2, true);
    await link(service.id, dateNeededQuestion.id, 3, true);
    await link(service.id, timeQuestion.id, 4, true);
    await link(service.id, oneTimeOrRecurringQuestion.id, 5, true);
    await link(service.id, recurringFrequencyQuestion.id, 6, false, recurringConditional);
    await link(service.id, payPerHourQuestion.id, 7, true);
    await link(service.id, notesQuestion.id, 8, false);
  }

  // Questions attach only to subcategories (level 2). Generic set for subcategories that had none.
  const genericQuestionOrder = [
    { q: dateNeededQuestion.id, order: 1, required: true },
    { q: timeQuestion.id, order: 2, required: true },
    { q: oneTimeOrRecurringQuestion.id, order: 3, required: true },
    { q: recurringFrequencyQuestion.id, order: 4, required: false, conditional: recurringConditional },
    { q: payPerHourQuestion.id, order: 5, required: true },
    { q: notesQuestion.id, order: 6, required: false },
  ];
  const subcategoriesWithoutQuestions = [
    aquariumTerrariumCategory,
    dogTrainingCategory,
    petSittingCategory,
    tutoringCategory,
    musicLessonsCategory,
    personalTrainerCategory,
    dieticianCategory,
    nutritionistCategory,
    housekeepingCategory,
    paintingCategory,
    organizingCategory,
    movingCategory,
    installationCategory,
    lawnCareCategory,
    gardeningCategory,
    carWashingCategory,
    seasonalMaintenanceCategory,
  ];
  for (const cat of subcategoriesWithoutQuestions) {
    for (const { q, order, required, conditional } of genericQuestionOrder) {
      await link(cat.id, q, order, required, conditional);
    }
  }

  // Verify every subcategory (level 2) has at least one question
  const allSubcategories = await categoryRepository.find({ where: { level: 2 }, order: { displayOrder: 'ASC' } });
  const missing: string[] = [];
  for (const sub of allSubcategories) {
    const count = await serviceQuestionRepository.count({ where: { serviceCategoryId: sub.id } });
    if (count === 0) missing.push(sub.name);
  }
  if (missing.length > 0) {
    throw new Error(`Subcategories without questions: ${missing.join(', ')}. Attach questions in seed.`);
  }
  console.log(`   ✅ All ${allSubcategories.length} subcategories have questions.`);

  // —— Static content ——
  const now = new Date();
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.HOMEPAGE,
      title: 'Welcome to Welpco',
      body: '<p>Find trusted local help for care, pet services, education, and more.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.ABOUT_US,
      title: 'About Us',
      body: '<p>Welpco connects families with reliable local service providers for childcare, pet care, tutoring, and home services.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.CONTACT,
      title: 'Contact',
      body: '<p>Email: support@welpco.com. We typically respond within 24 hours.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.TERMS,
      title: 'Terms of Service',
      body: '<p>By using Welpco you agree to our terms of service. Last updated: ' + now.toISOString().slice(0, 10) + '.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.PRIVACY,
      title: 'Privacy Policy',
      body: '<p>We respect your privacy. This policy describes how we collect, use, and protect your data.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );
  await staticContentRepository.save(
    staticContentRepository.create({
      contentType: ContentType.FAQ,
      title: 'FAQ',
      body: '<p>See the FAQ section for common questions and answers.</p>',
      version: 1,
      isPublished: true,
      publishedDate: now,
    }),
  );

  // —— FAQ items ——
  const faqs: Array<{ category: FAQCategory; question: string; answer: string; order: number }> = [
    { category: FAQCategory.GENERAL, question: 'What is Welpco?', answer: 'Welpco is a platform that connects you with trusted local service providers for care, pet services, education, and home services.', order: 1 },
    { category: FAQCategory.GENERAL, question: 'How do I create an account?', answer: 'Sign up with your email and choose whether you need services (customer) or want to offer services (welper).', order: 2 },
    { category: FAQCategory.CUSTOMER, question: 'How do I book a service?', answer: 'Browse categories, pick a service, answer the questions, and submit your request. Welpers can then respond.', order: 1 },
    { category: FAQCategory.CUSTOMER, question: 'How do I pay?', answer: 'Payment is handled securely through the platform. You pay after the service is completed as agreed.', order: 2 },
    { category: FAQCategory.WELPER, question: 'How do I get paid?', answer: 'Once a job is marked complete, payouts are processed according to your account settings.', order: 1 },
    { category: FAQCategory.WELPER, question: 'Can I set my own rates?', answer: 'Yes. You can set your hourly or per-service rates when creating your service offerings.', order: 2 },
  ];
  for (const f of faqs) {
    await faqRepository.save(
      faqRepository.create({
        category: f.category,
        question: f.question,
        answer: f.answer,
        displayOrder: f.order,
        isActive: true,
      }),
    );
  }

  // —— Marketing phrases ——
  const phrases: Array<{ text: string; type: PhraseType; context: string | null }> = [
    { text: 'Find trusted help near you', type: PhraseType.SLOGAN, context: 'homepage' },
    { text: 'Book a Welper today', type: PhraseType.CTA, context: 'homepage' },
    { text: 'Local help, real connections', type: PhraseType.TAGLINE, context: null },
    { text: 'Sign up to get started', type: PhraseType.CTA, context: 'registration' },
    { text: 'Join as a Welper', type: PhraseType.CTA, context: 'registration' },
  ];
  for (const p of phrases) {
    await marketingRepository.save(
      marketingRepository.create({
        phraseText: p.text,
        phraseType: p.type,
        usageContext: p.context,
        isActive: true,
      }),
    );
  }

  console.log('✅ Content seed (categories, questions, static, FAQ, marketing) completed.');
}
