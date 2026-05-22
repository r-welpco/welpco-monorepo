"use client";

import { useState } from "react";
import { Card } from "@welpco/ui/card";
import { Progress } from "@welpco/ui/progress";
import { Badge } from "@welpco/ui/badge";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { CheckCircle2, XCircle, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

export type ProfileType = "customer" | "welper";

export interface ProfileStep {
  id: string;
  label: string;
  completed: boolean;
  required: boolean;
  description?: string;
}

export interface ProfileCompletionStatusProps {
  profileType: ProfileType;
  steps: ProfileStep[];
  onCompleteStep?: (stepId: string) => void;
}

const CUSTOMER_REQUIRED_STEPS: Array<{ id: string; label: string; description: string }> = [
  { id: "name", label: "Name", description: "First name and last name" },
  { id: "phone", label: "Phone number", description: "Valid phone number" },
  { id: "address", label: "Address", description: "Complete address (street, city, state, zip)" },
];

const WELPER_REQUIRED_STEPS: Array<{ id: string; label: string; description: string }> = [
  { id: "bio", label: "Bio", description: "At least 20 characters describing your expertise" },
  { id: "photo", label: "Profile photo", description: "Clear photo of yourself" },
  { id: "serviceArea", label: "Service area", description: "Geographic area where you provide services" },
  { id: "serviceOfferings", label: "Service offerings", description: "At least one active service offering with hourly rate and experience" },
];

export function ProfileCompletionStatus({
  profileType,
  steps,
  onCompleteStep,
}: ProfileCompletionStatusProps) {
  const [showDetails, setShowDetails] = useState(false);
  const required = steps.filter((s) => s.required);
  const requiredDone = required.filter((s) => s.completed).length;
  const optional = steps.filter((s) => !s.required);
  const optionalDone = optional.filter((s) => s.completed).length;
  // The "Required" meter is the source of truth for "is this profile usable yet".
  // Optional fields get their own quieter line so finishing them feels rewarded
  // without ever rolling back the headline number — bible §22.6: don't count
  // an unfilled optional step against the user.
  const requiredPercent = required.length === 0 ? 100 : Math.round((requiredDone / required.length) * 100);
  const optionalPercent = optional.length === 0 ? 0 : Math.round((optionalDone / optional.length) * 100);

  const isProfileComplete = required.length > 0 && requiredDone === required.length;

  const getStepIcon = (step: ProfileStep) => {
    if (step.completed) {
      return <CheckCircle2 style={{ width: "16px", height: "16px", color: "var(--green-9)" }} />;
    }
    if (step.required) {
      return <AlertCircle style={{ width: "16px", height: "16px", color: "var(--red-9)" }} />;
    }
    return <XCircle style={{ width: "16px", height: "16px", color: "var(--gray-9)" }} />;
  };

  const detailsContent = (
    <>
      {required.length > 0 && (
        <Box>
          <Flex align="center" justify="between" mb="2">
            <Text size="2" weight="bold" color={isProfileComplete ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.danger}>
              Required steps
            </Text>
            <Text size="2" color={isProfileComplete ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.danger}>
              {requiredDone} of {required.length} done ({requiredPercent}%)
            </Text>
          </Flex>
          <Progress
            value={requiredPercent}
            color={isProfileComplete ? SEMANTIC_COLOR.success : SEMANTIC_COLOR.danger}
            aria-label={`Required steps: ${requiredDone} of ${required.length} done (${requiredPercent} percent)`}
          />
        </Box>
      )}

      {optional.length > 0 && (
        <Box>
          <Flex align="center" justify="between" mb="2">
            <Text size="2" weight="bold">
              Optional touches
            </Text>
            <Text size="2" color="gray" highContrast>
              {optionalDone} of {optional.length} added
            </Text>
          </Flex>
          <Progress
            value={optionalPercent}
            aria-label={`Optional steps: ${optionalDone} of ${optional.length} added`}
          />
        </Box>
      )}

      <Flex direction="column" gap="2">
        {steps.map((step) => (
          <Card
            key={step.id}
            size="2"
            variant="surface"
            style={{
              border: step.required && !step.completed ? "2px solid var(--red-6)" : "1px solid var(--gray-5)",
            }}
          >
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                {getStepIcon(step)}
                <Box style={{ flex: 1 }}>
                  <Flex align="center" gap="2" mb="1">
                    <Text size="2" weight={step.required ? "bold" : "medium"}>
                      {step.label}
                    </Text>
                    {step.required && (
                      <Badge color={SEMANTIC_COLOR.danger} variant="soft" size="1">
                        Required
                      </Badge>
                    )}
                    {step.completed && (
                      <Badge color={SEMANTIC_COLOR.success} variant="solid" size="1">
                        Done
                      </Badge>
                    )}
                  </Flex>
                  {step.description && (
                    <Text size="1" color="gray" highContrast>
                      {step.description}
                    </Text>
                  )}
                </Box>
              </Flex>
              {!step.completed && (
                <Button
                  variant="ghost"
                  color={SEMANTIC_COLOR.info}
                  size="2"
                  onClick={() => onCompleteStep?.(step.id)}
                >
                  Complete
                </Button>
              )}
            </Flex>
          </Card>
        ))}
      </Flex>
    </>
  );

  return (
    <Card size="4" style={{ width: "100%", minWidth: 0 }}>
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        {isProfileComplete ? (
          <>
            <Flex align="center" justify="between" gap="3" wrap="wrap">
              <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
                <CheckCircle2 style={{ width: "20px", height: "20px", color: "var(--green-9)", flexShrink: 0 }} />
                <Text size="2" weight="bold" color={SEMANTIC_COLOR.success}>
                  Profile complete! You're all set to {profileType === "customer" ? "book services" : "receive bookings"}.
                </Text>
              </Flex>
              <Button
                variant="ghost"
                color="gray"
                size="2"
                onClick={() => setShowDetails((v) => !v)}
              >
                {showDetails ? (
                  <>
                    <ChevronUp style={{ width: "16px", height: "16px" }} />
                    Hide details
                  </>
                ) : (
                  <>
                    <ChevronDown style={{ width: "16px", height: "16px" }} />
                    Show details
                  </>
                )}
              </Button>
            </Flex>
            {showDetails && detailsContent}
          </>
        ) : (
          <>
            <Box>
              <Heading size="4" mb="1">
                Profile completion
              </Heading>
              <Text size="2" color="gray" highContrast>
                {profileType === "customer"
                  ? "Complete required steps to unlock booking capabilities."
                  : "Complete required steps to start receiving job requests."}
              </Text>
            </Box>
            {detailsContent}
          </>
        )}
      </Flex>
    </Card>
  );
}
