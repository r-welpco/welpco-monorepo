"use client";

import { useMemo, useState, type KeyboardEvent } from "react";
import { Box } from "@welpco/ui/box";
import { Button } from "@welpco/ui/button";
import { Callout } from "@welpco/ui/callout";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { FORM_SPACING, SEMANTIC_COLOR } from "@welpco/ui/tokens";
import {
  DEFAULT_SELECT_ROLE_LABELS,
  type SelectRoleStepLabels,
} from "./labels";
import { SIGNUP_STEP_CARD_STYLE, type SelectedRole, type SignupStateLite } from "./types";

/**
 * Day 15 — Phase 2 Dispatch A. Step 2 of the unified signup wizard.
 *
 * Locks the role choice (customer or welper) — once submitted, the
 * orchestrator rejects re-selection (the wizard is a one-way state machine).
 *
 * UI: two large pill-cards as a `role="radiogroup"` with arrow-key
 * navigation per WAI-ARIA APG. Mobile-first: cards stack vertically on
 * small screens, sit side-by-side on `sm` and up. The selected card uses
 * the brand accent border + check affordance.
 */
export interface SelectRoleStepProps {
  /** Current wizard state. Used to pre-select if the role is already on file. */
  state: SignupStateLite;
  /** When false, the customer ("Find help") card is visible but not selectable. */
  customerRegistrationEnabled?: boolean;
  loading?: boolean;
  error?: string | null;
  labels?: SelectRoleStepLabels;
  onSubmit: (values: { role: SelectedRole }) => void | Promise<void>;
  onBack?: () => void;
}

interface RoleOption {
  value: SelectedRole;
  title: string;
  description: string;
}

export function SelectRoleStep({
  state,
  customerRegistrationEnabled = true,
  loading,
  error,
  labels: labelsProp,
  onSubmit,
  onBack,
}: SelectRoleStepProps) {
  const labels = labelsProp ?? DEFAULT_SELECT_ROLE_LABELS;

  const options = useMemo<readonly RoleOption[]>(
    () => [
      {
        value: "customer",
        title: labels.customerTitle,
        description: labels.customerDescription,
      },
      {
        value: "welper",
        title: labels.welperTitle,
        description: labels.welperDescription,
      },
    ],
    [labels],
  );

  const [selected, setSelected] = useState<SelectedRole | null>(() => {
    if (state.selectedRole) return state.selectedRole;
    if (!customerRegistrationEnabled) return "welper";
    return null;
  });
  const [submitted, setSubmitted] = useState(false);

  const selectableOptions = customerRegistrationEnabled
    ? options
    : options.filter((o) => o.value === "welper");

  const selectRole = (value: SelectedRole) => {
    if (!customerRegistrationEnabled && value === "customer") return;
    setSelected(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>, value: SelectedRole) => {
    if (!customerRegistrationEnabled && value === "customer") return;
    const idx = selectableOptions.findIndex((o) => o.value === value);
    if (idx < 0) return;
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      const next = selectableOptions[(idx + 1) % selectableOptions.length];
      selectRole(next.value);
      document.getElementById(`role-${next.value}`)?.focus();
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      const prev =
        selectableOptions[(idx - 1 + selectableOptions.length) % selectableOptions.length];
      selectRole(prev.value);
      document.getElementById(`role-${prev.value}`)?.focus();
    } else if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      selectRole(value);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!selected) return;
    await onSubmit({ role: selected });
  };

  const showRequired = submitted && !selected;

  return (
    <Card
      size="4"
      variant="surface"
      style={SIGNUP_STEP_CARD_STYLE}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        <Box>
          <Heading as="h1" size="6" trim="start" mb={FORM_SPACING.titleGap}>
            {labels.title}
          </Heading>
          <Text size="2" color="gray">
            {labels.description}
          </Text>
        </Box>

        {error && (
          <Callout.Root color={SEMANTIC_COLOR.danger} variant="surface" role="alert">
            <Callout.Text>{error}</Callout.Text>
          </Callout.Root>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Flex
            direction={{ initial: "column", sm: "row" }}
            gap="3"
            role="radiogroup"
            aria-required="true"
            aria-label={labels.radiogroupAriaLabel}
            mb={FORM_SPACING.fieldGap}
          >
            {options.map((option) => {
              const isDisabled =
                !customerRegistrationEnabled && option.value === "customer";
              const isSelected = !isDisabled && selected === option.value;
              const defaultFocusRole = customerRegistrationEnabled
                ? options[0].value
                : "welper";
              return (
                <Box
                  key={option.value}
                  id={`role-${option.value}`}
                  role="radio"
                  aria-disabled={isDisabled || undefined}
                  tabIndex={
                    isDisabled
                      ? -1
                      : isSelected ||
                          (selected === null && option.value === defaultFocusRole)
                        ? 0
                        : -1
                  }
                  aria-checked={isDisabled ? false : isSelected}
                  onClick={() => !isDisabled && selectRole(option.value)}
                  onKeyDown={(e) => !isDisabled && handleKeyDown(e, option.value)}
                  style={{
                    flex: 1,
                    cursor: isDisabled || loading ? "not-allowed" : "pointer",
                    padding: "var(--space-4)",
                    borderRadius: "var(--radius-3)",
                    border: isSelected
                      ? "var(--border-width-2, 2px) solid var(--grass-9)"
                      : "var(--border-width-2, 2px) solid var(--gray-a5)",
                    backgroundColor: isSelected
                      ? "var(--grass-a3)"
                      : "var(--color-surface)",
                    opacity: isDisabled ? 0.45 : 1,
                    outline: "none",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.outline = "2px solid var(--grass-9)";
                    e.currentTarget.style.outlineOffset = "2px";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.outline = "none";
                  }}
                >
                  <Flex direction="column" gap="2">
                    <Heading as="h3" size="4" trim="start">
                      {option.title}
                    </Heading>
                    <Text size="2" color="gray">
                      {isDisabled
                        ? labels.customerDisabledDescription
                        : option.description}
                    </Text>
                  </Flex>
                </Box>
              );
            })}
          </Flex>

          {showRequired && (
            <Text
              role="alert"
              size="1"
              color={SEMANTIC_COLOR.danger}
              mb={FORM_SPACING.fieldGap}
            >
              {labels.validationRequired}
            </Text>
          )}

          <Flex
            direction={{ initial: "column", sm: "row-reverse" }}
            gap="3"
            mt={FORM_SPACING.submitGap}
          >
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? labels.continueLoading : labels.continue}
            </Button>
            {onBack && (
              <Button
                type="button"
                size="3"
                variant="soft"
                color="gray"
                disabled={loading}
                onClick={onBack}
                style={{ width: "100%" }}
              >
                {labels.back}
              </Button>
            )}
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}
