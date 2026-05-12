"use client";

import { Card } from "@welpco/ui/card";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Progress } from "@welpco/ui/progress";
import { useMemo, useState } from "react";
import { WelcomeStep } from "./welcome-step";
import { ProfileBasicsStep } from "./profile-basics-step";
import { OnboardingCustomerPreferencesStep } from "./onboarding-customer-preferences-step";
import { SetupCompletionStep } from "./setup-completion-step";

export interface InitialSetupWorkflowProps {
  accountType: "customer" | "welper";
  email?: string;
  onComplete?: () => void | Promise<void>;
  onSkip?: () => void | Promise<void>;
  onStepComplete?: (step: string, data: any) => void | Promise<void>;
  loading?: boolean;
  /** Top-level service categories (customer onboarding step 2). */
  customerPreferenceCategories?: Array<{ id: string; name: string }>;
  customerPreferenceCategoriesLoading?: boolean;
}

type SetupStep = "welcome" | "profile" | "preferences" | "completion";

/**
 * Onboarding shell. Hosts the linear step sequence (welcome → profile →
 * preferences? → completion), renders a progress indicator at the top for
 * the intermediate steps, and delegates each step's content to its own
 * component.
 */
export function InitialSetupWorkflow({
  accountType,
  email,
  onComplete,
  onSkip,
  onStepComplete,
  loading,
  customerPreferenceCategories = [],
  customerPreferenceCategoriesLoading = false,
}: InitialSetupWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>("welcome");
  const [profileData, setProfileData] = useState<Record<string, any>>({});

  const steps: SetupStep[] = useMemo(() => {
    if (accountType === "customer") {
      return ["welcome", "profile", "preferences", "completion"];
    }
    return ["welcome", "profile", "completion"];
  }, [accountType]);

  const middleSteps = useMemo(
    () => steps.filter((s) => s !== "welcome" && s !== "completion"),
    [steps],
  );

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = steps.length <= 1 ? 100 : ((currentStepIndex + 1) / steps.length) * 100;

  const isIntermediateStep = currentStep !== "welcome" && currentStep !== "completion";
  const middleStepPosition = isIntermediateStep
    ? middleSteps.indexOf(currentStep) + 1
    : null;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    } else {
      onComplete?.();
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handleStepData = async (step: string, data: any) => {
    setProfileData((prev) => ({ ...prev, [step]: data }));
    if (onStepComplete) {
      await onStepComplete(step, data);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case "welcome":
        return (
          <WelcomeStep
            accountType={accountType}
            onNext={handleNext}
            onSkip={onSkip}
          />
        );
      case "profile":
        return (
          <ProfileBasicsStep
            defaultValues={profileData.profile}
            onNext={async (data) => {
              await handleStepData("profile", data);
              handleNext();
            }}
            onBack={handleBack}
            loading={loading}
          />
        );
      case "preferences":
        return (
          <OnboardingCustomerPreferencesStep
            categories={customerPreferenceCategories}
            categoriesLoading={customerPreferenceCategoriesLoading}
            defaultValues={profileData.preferences}
            onNext={async (data) => {
              await handleStepData("preferences", data);
              handleNext();
            }}
            onBack={handleBack}
            loading={loading}
          />
        );
      case "completion":
        return <SetupCompletionStep accountType={accountType} onComplete={onComplete} />;
      default:
        return null;
    }
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "720px", minWidth: 0 }}
    >
      <Flex direction="column" gap="5" style={{ minWidth: 0 }}>
        {isIntermediateStep && middleStepPosition != null && (
          <Box aria-live="polite">
            <Flex align="center" justify="between" mb="2">
              <Text size="2" color="gray" highContrast weight="medium">
                Step {middleStepPosition} of {middleSteps.length}
              </Text>
              <Text size="2" color="gray" highContrast>
                {Math.round(progress)}% complete
              </Text>
            </Flex>
            <Progress
              value={progress}
              aria-label={`Setup progress: step ${middleStepPosition} of ${middleSteps.length}, ${Math.round(progress)} percent complete`}
            />
          </Box>
        )}

        {renderStep()}
      </Flex>
    </Card>
  );
}

InitialSetupWorkflow.displayName = "InitialSetupWorkflow";
