import type {
  ServiceQuestion,
  ServiceQuestionType,
  ServiceQuestionValidation,
} from "./booking-service";

const TYPE_MAP: Record<string, ServiceQuestionType> = {
  text: "TEXT",
  number: "NUMBER",
  date: "DATE",
  time: "TIME",
  choice: "CHOICE",
  boolean: "BOOLEAN",
  entity_reference: "ENTITY_REFERENCE",
};

export function normalizeQuestionType(type: string): ServiceQuestionType {
  const key = type.toLowerCase();
  return TYPE_MAP[key] ?? (type.toUpperCase() as ServiceQuestionType);
}

export function normalizeEntityType(
  entityType: string | null | undefined,
): "CHILD" | "PERSON" | "PET" | undefined {
  if (!entityType) return undefined;
  const upper = entityType.toUpperCase();
  if (upper === "CHILD" || upper === "PERSON" || upper === "PET") return upper;
  return undefined;
}

/** Normalize BFF payloads (lowercase enums) for the web UI. */
export function normalizeServiceQuestion(raw: ServiceQuestion): ServiceQuestion {
  return {
    ...raw,
    question: {
      ...raw.question,
      type: normalizeQuestionType(raw.question.type),
      entityType: normalizeEntityType(raw.question.entityType),
    },
  };
}

export function normalizeServiceQuestions(raw: ServiceQuestion[]): ServiceQuestion[] {
  return raw.map(normalizeServiceQuestion);
}

export function matchesQuestionType(
  type: string,
  expected: ServiceQuestionType,
): boolean {
  return normalizeQuestionType(type) === expected;
}

const SCHEDULE_DATE_LABEL = "date needed";
const SCHEDULE_TIME_LABEL = "time";

/** Date/time captured in the global “When” section — hide duplicate service questions. */
export function isGlobalScheduleDuplicateQuestion(
  question: ServiceQuestion["question"],
): boolean {
  const label = question.label.trim().toLowerCase();
  if (matchesQuestionType(question.type, "DATE") && label === SCHEDULE_DATE_LABEL) {
    return true;
  }
  if (matchesQuestionType(question.type, "TIME") && label === SCHEDULE_TIME_LABEL) {
    return true;
  }
  return false;
}

export function isServiceQuestionVisible(
  sq: ServiceQuestion,
  answers: Record<string, string | number | boolean>,
): boolean {
  const showIf = sq.conditionalLogic?.showIf;
  if (!showIf) return true;
  return answers[showIf.questionId] === showIf.value;
}

export function getVisibleServiceQuestions(
  serviceQuestions: ServiceQuestion[],
  answers: Record<string, string | number | boolean>,
  options?: { hideScheduleDuplicates?: boolean },
): ServiceQuestion[] {
  const hideSchedule = options?.hideScheduleDuplicates ?? true;
  return [...serviceQuestions]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .filter((sq) => {
      if (!isServiceQuestionVisible(sq, answers)) return false;
      if (hideSchedule && isGlobalScheduleDuplicateQuestion(sq.question)) return false;
      return true;
    });
}

function isEmptyAnswer(value: string | number | boolean | undefined): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

export function isAnswerValidForQuestion(
  sq: ServiceQuestion,
  value: string | number | boolean | undefined,
  schedule?: { scheduledDate: string; startTime: string },
): boolean {
  const { question, isRequired } = sq;

  if (isGlobalScheduleDuplicateQuestion(question)) {
    if (!isRequired) return true;
    if (matchesQuestionType(question.type, "DATE")) {
      return !!schedule?.scheduledDate?.trim();
    }
    if (matchesQuestionType(question.type, "TIME")) {
      return !!schedule?.startTime?.trim();
    }
  }

  if (!isRequired && isEmptyAnswer(value)) return true;
  if (isRequired && isEmptyAnswer(value)) return false;

  if (matchesQuestionType(question.type, "BOOLEAN")) {
    return typeof value === "boolean";
  }

  if (matchesQuestionType(question.type, "CHOICE")) {
    return (
      typeof value === "string" &&
      !!question.options?.some((opt) => opt.value === value)
    );
  }

  if (matchesQuestionType(question.type, "DATE")) {
    return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
  }

  if (matchesQuestionType(question.type, "TIME")) {
    return typeof value === "string" && /^\d{2}:\d{2}$/.test(value);
  }

  const rules = question.validationRules;
  if (matchesQuestionType(question.type, "NUMBER")) {
    if (typeof value !== "number" || !Number.isFinite(value)) return false;
    if (rules?.min !== undefined && value < rules.min) return false;
    if (rules?.max !== undefined && value > rules.max) return false;
    return true;
  }

  if (
    rules?.pattern &&
    typeof value === "string" &&
    !validatePattern(value, rules)
  ) {
    return false;
  }

  return !isEmptyAnswer(value);
}

function validatePattern(value: string, rules: ServiceQuestionValidation): boolean {
  if (!rules.pattern) return true;
  try {
    return new RegExp(rules.pattern).test(value);
  } catch {
    return true;
  }
}

export function areRequiredServiceQuestionsAnswered(
  serviceQuestions: ServiceQuestion[],
  answers: Record<string, string | number | boolean>,
  schedule?: { scheduledDate: string; startTime: string },
): boolean {
  return serviceQuestions.every((sq) => {
    if (!sq.isRequired) return true;
    if (!isServiceQuestionVisible(sq, answers)) return true;
    return isAnswerValidForQuestion(sq, answers[sq.question.id], schedule);
  });
}

/** Merge global schedule + visible answers for API (includes hidden date/time question IDs). */
export function buildBookingAnswersPayload(
  serviceQuestions: ServiceQuestion[],
  answers: Record<string, string | number | boolean>,
  schedule: { scheduledDate: string; startTime: string },
): Record<string, string | number | boolean> {
  const merged: Record<string, string | number | boolean> = {};

  for (const sq of serviceQuestions) {
    if (!isServiceQuestionVisible(sq, answers)) continue;

    if (isGlobalScheduleDuplicateQuestion(sq.question)) {
      if (matchesQuestionType(sq.question.type, "DATE") && schedule.scheduledDate) {
        merged[sq.question.id] = schedule.scheduledDate;
      }
      if (matchesQuestionType(sq.question.type, "TIME") && schedule.startTime) {
        merged[sq.question.id] = schedule.startTime.slice(0, 5);
      }
      continue;
    }

    const val = answers[sq.question.id];
    if (val !== undefined && val !== "") {
      merged[sq.question.id] = val;
    }
  }

  return merged;
}

export function formatAnswerDisplayValue(
  question: ServiceQuestion["question"],
  value: string | number | boolean,
): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (matchesQuestionType(question.type, "CHOICE") && question.options) {
    const opt = question.options.find(
      (o) => o.value === String(value) || o.value === value,
    );
    if (opt) return opt.label;
  }
  return String(value);
}

export function buildAnswerLabelMap(
  serviceQuestions: ServiceQuestion[],
): Map<string, { label: string; format: (value: string | number | boolean) => string }> {
  const map = new Map<
    string,
    { label: string; format: (value: string | number | boolean) => string }
  >();
  for (const sq of serviceQuestions) {
    map.set(sq.question.id, {
      label: sq.question.label,
      format: (v) => formatAnswerDisplayValue(sq.question, v),
    });
  }
  return map;
}
