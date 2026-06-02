"use client";

import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { TextField } from "@welpco/ui/text-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@welpco/ui/select";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { ServiceQuestion } from "@/lib/services/booking-service";
import { matchesQuestionType } from "@/lib/services/service-questions-utils";
import type { QuestionFieldLabels } from "@/lib/i18n/question-field-labels";

function RequiredMarker() {
  return (
    <Text as="span" color={SEMANTIC_COLOR.danger} ml="1" aria-hidden="true">
      *
    </Text>
  );
}

export interface QuestionFieldProps {
  sq: ServiceQuestion;
  value: string | number | boolean | undefined;
  onChange: (val: string | number | boolean) => void;
  labels: QuestionFieldLabels;
}

export function QuestionField({ sq, value, onChange, labels }: QuestionFieldProps) {
  const { question, isRequired } = sq;
  const fieldId = `q-${question.id}`;
  const labelId = `${fieldId}-label`;
  const helpId = question.helpText ? `${fieldId}-help` : undefined;
  const strVal = value !== undefined && value !== null ? String(value) : "";

  const entityPlaceholder =
    question.placeholder ??
    (question.entityType === "CHILD"
      ? labels.entityChild
      : question.entityType === "PERSON"
        ? labels.entityPerson
        : question.entityType === "PET"
          ? labels.entityPet
          : labels.entityDefault);

  return (
    <Box>
      {matchesQuestionType(question.type, "CHOICE") ||
      matchesQuestionType(question.type, "BOOLEAN") ? (
        <Text
          as="label"
          id={labelId}
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
        >
          {question.label}
          {isRequired && <RequiredMarker />}
        </Text>
      ) : (
        <Text
          as="label"
          htmlFor={fieldId}
          size="2"
          weight="medium"
          mb={FORM_SPACING.labelGap}
          style={{ display: "block" }}
        >
          {question.label}
          {isRequired && <RequiredMarker />}
        </Text>
      )}

      {question.helpText && (
        <Text as="p" id={helpId} size="1" color="gray" mb={FORM_SPACING.labelGap}>
          {question.helpText}
        </Text>
      )}

      {matchesQuestionType(question.type, "TEXT") && (
        <TextField.Root
          id={fieldId}
          type="text"
          value={strVal}
          placeholder={question.placeholder ?? undefined}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {matchesQuestionType(question.type, "NUMBER") && (
        <TextField.Root
          id={fieldId}
          type="number"
          value={strVal}
          placeholder={question.placeholder ?? undefined}
          min={question.validationRules?.min}
          max={question.validationRules?.max}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? "" : Number(v));
          }}
        />
      )}

      {matchesQuestionType(question.type, "DATE") && (
        <TextField.Root
          id={fieldId}
          type="date"
          value={strVal}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {matchesQuestionType(question.type, "TIME") && (
        <TextField.Root
          id={fieldId}
          type="time"
          value={strVal}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {matchesQuestionType(question.type, "CHOICE") && (
        <Select
          value={strVal || undefined}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger
            id={fieldId}
            aria-labelledby={labelId}
            aria-required={isRequired || undefined}
            aria-describedby={helpId}
            placeholder={labels.select}
          />
          <SelectContent>
            {question.options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {matchesQuestionType(question.type, "BOOLEAN") && (
        <Select
          value={
            value === true ? "true" : value === false ? "false" : undefined
          }
          onValueChange={(v) => onChange(v === "true")}
        >
          <SelectTrigger
            id={fieldId}
            aria-labelledby={labelId}
            aria-required={isRequired || undefined}
            aria-describedby={helpId}
            placeholder={labels.select}
          />
          <SelectContent>
            <SelectItem value="true">{labels.yes}</SelectItem>
            <SelectItem value="false">{labels.no}</SelectItem>
          </SelectContent>
        </Select>
      )}

      {matchesQuestionType(question.type, "ENTITY_REFERENCE") && (
        <TextField.Root
          id={fieldId}
          type="text"
          value={strVal}
          placeholder={entityPlaceholder}
          required={isRequired}
          aria-required={isRequired || undefined}
          aria-describedby={helpId}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </Box>
  );
}
