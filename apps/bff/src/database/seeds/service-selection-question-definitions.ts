import { EntityType, QuestionType } from '../../domains/content-management/entities';

/** Single booking-detail question (stored in `questions`, linked via `service_questions`). */
export interface ServiceSelectionQuestionDef {
  label: string;
  type: QuestionType;
  placeholder?: string;
  helpText?: string;
  options?: Array<{ value: string; label: string }>;
  entityType?: EntityType;
  validationRules?: { required?: boolean; min?: number; max?: number };
  /** Defaults to true when omitted */
  required?: boolean;
}

export interface ServiceSelectionSubcategoryDef {
  /** Canonical name from SERVICE_CATEGORY_TAXONOMY */
  subcategoryName: string;
  questions: ServiceSelectionQuestionDef[];
}

const yesNo: Array<{ value: string; label: string }> = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
];

const genderOptions: Array<{ value: string; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
];

const petTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'dog', label: 'Dog' },
  { value: 'cat', label: 'Cat' },
  { value: 'other', label: 'Other' },
];

const skillLevelOptions: Array<{ value: string; label: string }> = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];

const inPersonOrOnline: Array<{ value: string; label: string }> = [
  { value: 'in-person', label: 'In-person' },
  { value: 'online', label: 'Online' },
];

const dateNeeded: ServiceSelectionQuestionDef = {
  label: 'Date needed',
  type: QuestionType.DATE,
  required: true,
};

const time: ServiceSelectionQuestionDef = {
  label: 'Time',
  type: QuestionType.TIME,
  required: true,
};

const description: ServiceSelectionQuestionDef = {
  label: 'Description',
  type: QuestionType.TEXT,
  placeholder: 'Additional details',
  required: false,
};

function dateTimeDescription(): ServiceSelectionQuestionDef[] {
  return [dateNeeded, time, description];
}

const tutoringCoreQuestions: ServiceSelectionQuestionDef[] = [
  {
    label: 'In-person or online?',
    type: QuestionType.CHOICE,
    options: inPersonOrOnline,
    required: true,
  },
  {
    label: 'Student grade/level',
    type: QuestionType.TEXT,
    required: true,
  },
];

function mathOrFrenchTutoringQuestions(): ServiceSelectionQuestionDef[] {
  return [...tutoringCoreQuestions, ...dateTimeDescription()];
}

function englishTutoringQuestions(): ServiceSelectionQuestionDef[] {
  return [...tutoringCoreQuestions, ...dateTimeDescription()];
}

/**
 * Booking-detail questions per subcategory (Service selection pages — EN).
 * Subcategory names must match SERVICE_CATEGORY_TAXONOMY.
 */
export const SERVICE_SELECTION_SUBCATEGORY_QUESTIONS: ServiceSelectionSubcategoryDef[] = [
  // —— Care ——
  {
    subcategoryName: 'Babysitter',
    questions: [
      {
        label: 'How many children',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Age of each child',
        type: QuestionType.TEXT,
        placeholder: 'e.g. 3, 7',
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Elderly Care',
    questions: [
      {
        label: 'Age of the person',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Gender',
        type: QuestionType.CHOICE,
        options: genderOptions,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Special Needs',
    questions: [
      {
        label: 'Age of the person',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Gender',
        type: QuestionType.CHOICE,
        options: genderOptions,
        required: true,
      },
      {
        label: 'What is the special need?',
        type: QuestionType.TEXT,
        required: true,
      },
      description,
      dateNeeded,
      time,
    ],
  },
  // —— Pet Care ——
  {
    subcategoryName: 'Dog Walks',
    questions: [
      {
        label: 'How many dogs?',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Size of each dog',
        type: QuestionType.TEXT,
        placeholder: 'e.g. small, medium, large',
        helpText: 'Indicate size for each dog (small, medium, large).',
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Pet Grooming',
    questions: [
      {
        label: 'Type of pet?',
        type: QuestionType.CHOICE,
        options: petTypeOptions,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Aquarium and Terrarium Cleaning/Maintenance',
    questions: [
      {
        label: 'Approximate size of Terrarium',
        type: QuestionType.TEXT,
        required: true,
      },
      description,
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Dog Training',
    questions: [
      {
        label: 'How many dogs?',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      description,
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Pet Sitting',
    questions: [
      {
        label: 'How many pets?',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Types of pets',
        type: QuestionType.TEXT,
        placeholder: 'Dog, cat, other',
        required: true,
      },
      {
        label: 'Size of the pet',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Duration or number of hours',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      description,
    ],
  },
  // —— Learning & Lessons ——
  {
    subcategoryName: 'Math Tutoring',
    questions: mathOrFrenchTutoringQuestions(),
  },
  {
    subcategoryName: 'French Tutoring',
    questions: mathOrFrenchTutoringQuestions(),
  },
  {
    subcategoryName: 'English Tutoring',
    questions: englishTutoringQuestions(),
  },
  {
    subcategoryName: 'Music Lessons',
    questions: [
      {
        label: 'Which instrument?',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Student level',
        type: QuestionType.CHOICE,
        options: skillLevelOptions,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Cooking Lessons',
    questions: [
      {
        label: 'Number of participants',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Swimming Lessons',
    questions: [
      {
        label: 'Age',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Current level',
        type: QuestionType.CHOICE,
        options: skillLevelOptions,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  // —— Home Cleaning ——
  {
    subcategoryName: 'Housekeeping',
    questions: [
      {
        label: 'Number of rooms',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        helpText: "We'll ask about the bathrooms next.",
        required: true,
      },
      {
        label: 'Number of bathrooms',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Are there pets in your space?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'none', label: 'None' },
          { value: 'dogs', label: 'Dogs' },
          { value: 'cats', label: 'Cats' },
          { value: 'dogs-and-cats', label: 'Dogs and cats' },
        ],
        helpText: 'This will help your Welper bring the right tools for the job.',
        required: true,
      },
      {
        label: 'How would you describe your space?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'regularly-cleaned', label: 'Regularly cleaned' },
          { value: 'deep-clean', label: 'Needs a deep clean' },
          { value: 'after-construction', label: 'After construction' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Organizing',
    questions: [
      {
        label: 'Which area needs organizing?',
        type: QuestionType.TEXT,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  // —— Exterior Maintenance ——
  {
    subcategoryName: 'Lawn Mowing',
    questions: [
      {
        label: 'Approximate yard size',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Which area?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'front-yard', label: 'Front yard' },
          { value: 'backyard', label: 'Backyard' },
          { value: 'both', label: 'Both' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Tree Planting',
    questions: [
      {
        label: 'How many trees need to be planted?',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Is digging required?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Gardening',
    questions: [
      {
        label: 'What type of gardening help?',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Approximate garden size',
        type: QuestionType.TEXT,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Car Washing',
    questions: [
      {
        label: 'How many vehicles need service?',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Type of vehicle',
        type: QuestionType.CHOICE,
        options: [
          { value: 'suv', label: 'SUV' },
          { value: 'car', label: 'Car' },
          { value: 'sports-car', label: 'Sports car' },
          { value: 'truck', label: 'Truck' },
          { value: 'van', label: 'Van' },
          { value: 'other', label: 'Other' },
        ],
        required: true,
      },
      {
        label: 'What type of wash would you like?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'exterior-only', label: 'Exterior only' },
          { value: 'interior-only', label: 'Interior only' },
          { value: 'interior-exterior', label: 'Interior & Exterior' },
        ],
        required: true,
      },
      {
        label: 'Approximate condition of the vehicle',
        type: QuestionType.CHOICE,
        options: [
          { value: 'light', label: 'Light cleaning' },
          { value: 'moderate', label: 'Moderate cleaning' },
          { value: 'heavy', label: 'Heavy cleaning' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Window Cleaning',
    questions: [
      {
        label: 'Interior / Exterior / Both',
        type: QuestionType.CHOICE,
        options: [
          { value: 'interior', label: 'Interior' },
          { value: 'exterior', label: 'Exterior' },
          { value: 'both', label: 'Both' },
        ],
        required: true,
      },
      {
        label: 'Number of windows',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Exterior Property Cleaning',
    questions: [
      {
        label: 'What areas need cleaning?',
        type: QuestionType.TEXT,
        placeholder: 'Driveway, walkways, patio, etc.',
        helpText: 'Select all that apply — list each area.',
        required: true,
      },
      {
        label: 'Approximate size of the area',
        type: QuestionType.CHOICE,
        options: [
          { value: 'small', label: 'Small' },
          { value: 'medium', label: 'Medium' },
          { value: 'large', label: 'Large' },
        ],
        required: true,
      },
      {
        label: 'Type of cleaning needed',
        type: QuestionType.CHOICE,
        options: [
          { value: 'light', label: 'Light cleaning (dust / dirt / surface wash)' },
          { value: 'deep', label: 'Deep cleaning (stains / pressure washing)' },
        ],
        required: true,
      },
      {
        label: 'Do you require pressure washing?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Snow Removal',
    questions: [
      {
        label: 'Which area?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'driveway', label: 'Driveway' },
          { value: 'walkway', label: 'Walkway' },
          { value: 'stairs', label: 'Stairs' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Pool Opening/Closing',
    questions: [
      {
        label: 'Opening, closing or cleaning',
        type: QuestionType.CHOICE,
        options: [
          { value: 'opening', label: 'Opening' },
          { value: 'closing', label: 'Closing' },
          { value: 'cleaning', label: 'Cleaning' },
        ],
        required: true,
      },
      {
        label: 'Type of pool',
        type: QuestionType.CHOICE,
        options: [
          { value: 'above-ground', label: 'Above-ground' },
          { value: 'in-ground', label: 'In-ground' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Summer/Winter Preparation',
    questions: [
      {
        label: 'Type of seasonal preparation',
        type: QuestionType.CHOICE,
        options: [
          { value: 'summer', label: 'Summer preparation' },
          { value: 'winter', label: 'Winter preparation' },
        ],
        required: true,
      },
      {
        label: 'What areas need preparation?',
        type: QuestionType.TEXT,
        placeholder: 'Yard, patio, driveway, etc.',
        helpText: 'Select all that apply — list each area.',
        required: true,
      },
      {
        label: 'Do you need furniture moved or stored?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  // —— Home Help ——
  {
    subcategoryName: 'Furniture Assembly',
    questions: [
      {
        label: 'What items need assembly?',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Number of items',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Do you have instructions available?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'TV & Shelf Mounting',
    questions: [
      {
        label: 'What needs to be mounted?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'tv', label: 'TV' },
          { value: 'shelves', label: 'Shelves' },
          { value: 'both', label: 'Both' },
        ],
        required: true,
      },
      {
        label: 'TV size (if applicable)',
        type: QuestionType.TEXT,
        required: false,
      },
      {
        label: 'Wall type (if known)',
        type: QuestionType.CHOICE,
        options: [
          { value: 'drywall', label: 'Drywall' },
          { value: 'concrete', label: 'Concrete' },
          { value: 'brick', label: 'Brick' },
          { value: 'not-sure', label: 'Not sure' },
        ],
        required: false,
      },
      {
        label: 'Do you already have brackets/anchors?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No' },
          { value: 'not-sure', label: 'Not sure' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Smart Home Setup',
    questions: [
      {
        label: 'What devices need setup?',
        type: QuestionType.TEXT,
        placeholder: 'Thermostat, cameras, doorbell, etc.',
        helpText: 'Select all that apply — list each device.',
        required: true,
      },
      {
        label: 'Wi-Fi already installed?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Small Repairs',
    questions: [
      {
        label: 'What needs to be repaired?',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Location in home',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Severity',
        type: QuestionType.CHOICE,
        options: [
          { value: 'minor', label: 'Minor fix' },
          { value: 'moderate', label: 'Moderate' },
          { value: 'urgent', label: 'Urgent' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Appliance Installation',
    questions: [
      {
        label: 'What appliance needs installation?',
        type: QuestionType.CHOICE,
        options: [
          { value: 'washer', label: 'Washer' },
          { value: 'dryer', label: 'Dryer' },
          { value: 'dishwasher', label: 'Dishwasher' },
          { value: 'fridge', label: 'Fridge' },
          { value: 'stove', label: 'Stove' },
          { value: 'other', label: 'Other' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Moving Help',
    questions: [
      {
        label: 'Move type',
        type: QuestionType.CHOICE,
        options: [
          { value: 'apartment', label: 'Apartment' },
          { value: 'house', label: 'House' },
          { value: 'office', label: 'Office' },
        ],
        required: true,
      },
      {
        label: 'Pickup location',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Drop-off location',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Number of rooms/items',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Elevator available?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Heavy Lifting',
    questions: [
      {
        label: 'What needs to be moved?',
        type: QuestionType.TEXT,
        required: true,
      },
      {
        label: 'Approximate weight/size',
        type: QuestionType.CHOICE,
        options: [
          { value: 'light', label: 'Light' },
          { value: 'medium', label: 'Medium' },
          { value: 'heavy', label: 'Heavy' },
        ],
        required: true,
      },
      {
        label: 'Number of items',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Same building',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Painting Touch-Ups',
    questions: [
      {
        label: 'Surface area',
        type: QuestionType.CHOICE,
        options: [
          { value: 'wall', label: 'Wall' },
          { value: 'ceiling', label: 'Ceiling' },
          { value: 'trim', label: 'Trim' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Picture Hanging',
    questions: [
      {
        label: 'Number of items to hang',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 1 },
        required: true,
      },
      {
        label: 'Type of items',
        type: QuestionType.CHOICE,
        options: [
          { value: 'frames', label: 'Frames' },
          { value: 'mirrors', label: 'Mirrors' },
          { value: 'art', label: 'Art pieces' },
          { value: 'other', label: 'Other' },
        ],
        required: true,
      },
      {
        label: 'Wall type (if known)',
        type: QuestionType.CHOICE,
        options: [
          { value: 'drywall', label: 'Drywall' },
          { value: 'brick', label: 'Brick' },
          { value: 'concrete', label: 'Concrete' },
        ],
        required: false,
      },
      {
        label: 'Do you have hooks/anchors?',
        type: QuestionType.CHOICE,
        options: yesNo,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  // —— Health & Wellness ——
  {
    subcategoryName: 'Meal Preparation',
    questions: dateTimeDescription(),
  },
  {
    subcategoryName: 'Personal Trainer',
    questions: [
      {
        label: 'Age of client',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Gender',
        type: QuestionType.CHOICE,
        options: genderOptions,
        required: true,
      },
      {
        label: 'Needs',
        type: QuestionType.CHOICE,
        options: [
          { value: 'build-muscle', label: 'Build muscle' },
          { value: 'lose-weight', label: 'Lose weight' },
          { value: 'coaching', label: 'Coaching' },
        ],
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Wellness Support',
    questions: [
      {
        label: 'Age of client',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Gender',
        type: QuestionType.CHOICE,
        options: genderOptions,
        required: true,
      },
      ...dateTimeDescription(),
    ],
  },
  {
    subcategoryName: 'Nutritionist',
    questions: [
      {
        label: 'Age of client',
        type: QuestionType.NUMBER,
        validationRules: { required: true, min: 0 },
        required: true,
      },
      {
        label: 'Gender',
        type: QuestionType.CHOICE,
        options: genderOptions,
        required: true,
      },
      dateNeeded,
      time,
    ],
  },
  // —— Events & Hospitality ——
  {
    subcategoryName: 'Catering Help',
    questions: dateTimeDescription(),
  },
  {
    subcategoryName: 'Party Assistance',
    questions: dateTimeDescription(),
  },
  {
    subcategoryName: 'Serving',
    questions: dateTimeDescription(),
  },
  {
    subcategoryName: 'Entertainer',
    questions: dateTimeDescription(),
  },
  {
    subcategoryName: 'Bartending',
    questions: dateTimeDescription(),
  },
];

/** Subcategory names listed in Service selection pages — EN.md (normalized). */
export const MARKDOWN_DOC_SUBCATEGORY_NAMES = [
  'Babysitter',
  'Elderly Care',
  'Special Needs',
  'Dog Walks',
  'Pet Grooming',
  'Aquarium and Terrarium Cleaning/Maintenance',
  'Dog Training',
  'Pet Sitting',
  'Math Tutoring',
  'French Tutoring',
  'English Tutoring',
  'Music Lessons',
  'Cooking Lessons',
  'Swimming Lessons',
  'Housekeeping',
  'Organizing',
  'Lawn Mowing',
  'Tree Planting',
  'Gardening',
  'Car Washing',
  'Window Cleaning',
  'Exterior Property Cleaning',
  'Snow Removal',
  'Pool Opening/Closing',
  'Summer/Winter Preparation',
  'Furniture Assembly',
  'TV & Shelf Mounting',
  'Smart Home Setup',
  'Small Repairs',
  'Appliance Installation',
  'Moving Help',
  'Heavy Lifting',
  'Painting Touch-Ups',
  'Picture Hanging',
  'Meal Preparation',
  'Personal Trainer',
  'Wellness Support',
  'Nutritionist',
  'Catering Help',
  'Party Assistance',
  'Serving',
  'Entertainer',
  'Bartending',
] as const;
