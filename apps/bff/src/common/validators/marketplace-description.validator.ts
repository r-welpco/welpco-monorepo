import {
  registerDecorator,
  ValidationArguments,
  ValidationError,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

export const MARKETPLACE_DESCRIPTION_CONSTRAINT =
  'marketplaceDescriptionPolicy';

export type MarketplaceDescriptionViolation = 'email' | 'phone' | 'negotiation';

export interface MarketplaceDescriptionValidationResult {
  valid: boolean;
  violations: MarketplaceDescriptionViolation[];
}

export interface MarketplaceDescriptionPolicyError {
  fields: string[];
  violations: MarketplaceDescriptionViolation[];
}

const NUMBER_WORDS: Readonly<Record<string, string>> = {
  zero: '0',
  one: '1',
  two: '2',
  three: '3',
  four: '4',
  five: '5',
  six: '6',
  seven: '7',
  eight: '8',
  nine: '9',
  un: '1',
  une: '1',
  deux: '2',
  trois: '3',
  quatre: '4',
  cinq: '5',
  sept: '7',
  huit: '8',
  neuf: '9',
  oh: '0',
  o: '0',
  ten: '10',
  eleven: '11',
  twelve: '12',
  thirteen: '13',
  fourteen: '14',
  fifteen: '15',
  sixteen: '16',
  seventeen: '17',
  eighteen: '18',
  nineteen: '19',
  twenty: '20',
  thirty: '30',
  forty: '40',
  fifty: '50',
  sixty: '60',
  seventy: '70',
  eighty: '80',
  ninety: '90',
  dix: '10',
  onze: '11',
  douze: '12',
  treize: '13',
  quatorze: '14',
  quinze: '15',
  seize: '16',
  vingt: '20',
  trente: '30',
  quarante: '40',
  cinquante: '50',
  soixante: '60',
};

const EMAIL_PATTERN =
  /\b[a-z0-9]+(?:\s+(?:dot|point|dash|hyphen|underscore)\s+[a-z0-9]+)*\s+(?:at|arobase)\s+[a-z0-9]+(?:\s+(?:dot|point)\s+[a-z0-9]+)+\b/;
const NEGOTIATION_PATTERN = /\b(?:re)?(?:negoti|negoci)[a-z]*\b/;
const PHONE_CONTEXT_PATTERN =
  /\b(?:phone|telephone|tel|call|text|sms|whatsapp|number|numero|mobile|cell|contact|appel|appeler|appelez|texto)\b/;
const PHONE_CONNECTORS = new Set([
  'and',
  'dash',
  'dot',
  'et',
  'ext',
  'extension',
  'hyphen',
  'point',
  'puis',
  'then',
  'tiret',
  'x',
]);
const NUMBER_MULTIPLIERS: Readonly<Record<string, number>> = {
  double: 2,
  triple: 3,
};

/** Lowercases, removes accents, and turns punctuation into token boundaries. */
export function normalizeMarketplaceDescription(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function containsPhone(value: string): boolean {
  const normalized = normalizeMarketplaceDescription(value);
  const tokens = normalized.split(' ');
  const hasPhoneContext = PHONE_CONTEXT_PATTERN.test(normalized);
  const hasInternationalPrefix = /(?:^|\s)\+\s*\d/.test(value.normalize('NFKC'));
  let digitCount = 0;
  let numericTokens = 0;
  let wordTokens = 0;
  let containsDigitToken = false;
  let pendingMultiplier = 1;
  let groupLengths: number[] = [];

  const isPhoneRun = () => {
    if (digitCount < 7 || digitCount > 15) return false;
    if (hasPhoneContext || hasInternationalPrefix || digitCount >= 10) return true;
    if (wordTokens > 0 && containsDigitToken) return true;
    return (
      containsDigitToken &&
      numericTokens >= 2 &&
      groupLengths[0] <= 3 &&
      groupLengths.every((length) => length <= 4)
    );
  };

  const reset = () => {
    digitCount = 0;
    numericTokens = 0;
    wordTokens = 0;
    containsDigitToken = false;
    pendingMultiplier = 1;
    groupLengths = [];
  };

  for (const token of tokens) {
    const multiplier = NUMBER_MULTIPLIERS[token];
    if (multiplier) {
      pendingMultiplier = multiplier;
      continue;
    }

    const isDigitToken = /^\d+$/.test(token);
    const digits = isDigitToken ? token : NUMBER_WORDS[token];
    if (digits) {
      const addedLength = digits.length * pendingMultiplier;
      digitCount += addedLength;
      numericTokens += 1;
      wordTokens += isDigitToken ? 0 : 1;
      containsDigitToken ||= isDigitToken;
      groupLengths.push(addedLength);
      pendingMultiplier = 1;
      if (isPhoneRun()) return true;
      if (digitCount > 15) reset();
      continue;
    }

    if (PHONE_CONNECTORS.has(token) || /^[a-z]$/.test(token)) {
      pendingMultiplier = 1;
      continue;
    }

    if (isPhoneRun()) return true;
    reset();
  }

  return isPhoneRun();
}

function normalizeEmail(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/@/g, ' at ')
    .replace(/\./g, ' dot ')
    .replace(/-/g, ' dash ')
    .replace(/_/g, ' underscore ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function normalizeNegotiation(value: string): string {
  return normalizeMarketplaceDescription(value)
    .replace(/(?:\b[a-z]\s+){5,}[a-z]\b/g, (match) =>
      match.replace(/\s+/g, ''),
    )
    .replace(/0/g, 'o')
    .replace(/1/g, 'i');
}

/** Evaluates public marketplace text without retaining or logging its contents. */
export function validateMarketplaceDescription(
  value: string,
): MarketplaceDescriptionValidationResult {
  if (typeof value !== 'string') return { valid: true, violations: [] };

  const violations: MarketplaceDescriptionViolation[] = [];

  if (EMAIL_PATTERN.test(normalizeEmail(value))) {
    violations.push('email');
  }
  if (containsPhone(value)) violations.push('phone');
  if (NEGOTIATION_PATTERN.test(normalizeNegotiation(value))) {
    violations.push('negotiation');
  }

  return { valid: violations.length === 0, violations };
}

/** Validates every string nested in public marketplace payload content. */
export function validateMarketplaceContent(
  value: unknown,
): MarketplaceDescriptionValidationResult {
  const violations = new Set<MarketplaceDescriptionViolation>();
  const visit = (candidate: unknown) => {
    if (typeof candidate === 'string') {
      for (const violation of validateMarketplaceDescription(candidate)
        .violations) {
        violations.add(violation);
      }
    } else if (Array.isArray(candidate)) {
      for (const item of candidate) visit(item);
    } else if (candidate && typeof candidate === 'object') {
      for (const item of Object.values(candidate)) visit(item);
    }
  };
  visit(value);
  return { valid: violations.size === 0, violations: [...violations] };
}

/** Collects policy failures, including paths inside nested DTO arrays. */
export function collectMarketplaceDescriptionPolicyError(
  errors: ValidationError[],
): MarketplaceDescriptionPolicyError | null {
  const fields = new Set<string>();
  const violations = new Set<MarketplaceDescriptionViolation>();

  const visit = (error: ValidationError, parentPath = '') => {
    const path = parentPath
      ? `${parentPath}.${error.property}`
      : error.property;
    if (error.constraints?.[MARKETPLACE_DESCRIPTION_CONSTRAINT]) {
      fields.add(path);
      for (const violation of validateMarketplaceContent(error.value)
        .violations) {
        violations.add(violation);
      }
    }
    for (const child of error.children ?? []) visit(child, path);
  };

  for (const error of errors) visit(error);
  if (fields.size === 0) return null;
  return { fields: [...fields], violations: [...violations] };
}

@ValidatorConstraint({ name: MARKETPLACE_DESCRIPTION_CONSTRAINT, async: false })
export class MarketplaceDescriptionConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    return validateMarketplaceContent(value).valid;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} contains contact information or negotiation-related content that is not allowed`;
  }
}

export function IsMarketplaceDescriptionAllowed(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: MARKETPLACE_DESCRIPTION_CONSTRAINT,
      target: object.constructor,
      propertyName: propertyName.toString(),
      options: validationOptions,
      validator: MarketplaceDescriptionConstraint,
    });
  };
}
