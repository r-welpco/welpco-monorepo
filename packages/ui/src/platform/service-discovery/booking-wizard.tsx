"use client";

import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent } from "@welpco/ui/dialog";
import { Button } from "@welpco/ui/button";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Skeleton } from "@welpco/ui/skeleton";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import type { WelperProfileDialogOffering, WelperProfileDialogProfile } from "./welper-profile-dialog";
import {
  SelectOfferingStep,
  ScheduleStep,
  QuestionsStep,
  SummaryStep,
} from "./booking-wizard-steps";

export type BookingWizardQuestionType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "choice"
  | "boolean";

export interface BookingWizardQuestion {
  id: string;
  questionId: string;
  displayOrder: number;
  isRequired: boolean;
  question: {
    id: string;
    type: BookingWizardQuestionType;
    label: string;
    placeholder?: string | null;
    helpText?: string | null;
    options?: Array<{ value: string; label: string }> | null;
  };
}

export interface BookingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: WelperProfileDialogProfile | null;
  profileLoading?: boolean;
  initialOffering?: WelperProfileDialogOffering | null;
  serviceQuestions: BookingWizardQuestion[];
  questionsLoading?: boolean;
  answers: Record<string, string | number | boolean>;
  onAnswerChange: (questionId: string, value: string | number | boolean | undefined) => void;
  onSelectOffering?: (offering: WelperProfileDialogOffering) => void;
  onSubmit: (payload: {
    welperId: string;
    offering: WelperProfileDialogOffering;
    answers: Record<string, string | number | boolean>;
    scheduledDate?: string;
    scheduledStartTime?: string;
    scheduledEndTime?: string;
    durationMinutes?: number;
  }) => void;
  submitLoading?: boolean;
  collectSchedule?: boolean;
}

type Step = "select" | "schedule" | "questions" | "summary" | "success";

function computeDuration(start: string, end: string): number | null {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh ?? 0) * 60 + (em ?? 0) - (sh ?? 0) * 60 - (sm ?? 0);
  return diff > 0 ? diff : null;
}

export function BookingWizard({
  open,
  onOpenChange,
  profile,
  profileLoading = false,
  initialOffering = null,
  serviceQuestions,
  questionsLoading = false,
  answers,
  onAnswerChange,
  onSelectOffering,
  onSubmit,
  submitLoading = false,
  collectSchedule = true,
}: BookingWizardProps) {
  const [selectedOffering, setSelectedOffering] = useState<WelperProfileDialogOffering | null>(
    initialOffering ?? null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [step, setStep] = useState<Step>("select");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledStartTime, setScheduledStartTime] = useState("");
  const [scheduledEndTime, setScheduledEndTime] = useState("");

  const offerings = profile?.serviceOfferings ?? [];
  const hasMultipleOfferings = offerings.length > 1;
  const effectiveOffering = selectedOffering ?? (offerings.length === 1 ? offerings[0] : null);

  const orderedQuestions = useMemo(
    () => [...serviceQuestions].sort((a, b) => a.displayOrder - b.displayOrder),
    [serviceQuestions]
  );

  const durationMinutes = computeDuration(scheduledStartTime, scheduledEndTime);

  // --- Effects ---

  useEffect(() => {
    if (!open) return;
    if (initialOffering) {
      setSelectedOffering(initialOffering);
      setScheduledDate("");
      setScheduledStartTime("");
      setScheduledEndTime("");
      if (collectSchedule) {
        setStep("schedule");
      } else {
        setStep(serviceQuestions.length > 0 ? "questions" : "summary");
      }
      setCurrentQuestionIndex(0);
    } else {
      setSelectedOffering(null);
      setStep("select");
      setCurrentQuestionIndex(0);
      setScheduledDate("");
      setScheduledStartTime("");
      setScheduledEndTime("");
    }
  }, [open, initialOffering?.id, serviceQuestions.length, collectSchedule]);

  useEffect(() => {
    if (step === "questions" && orderedQuestions.length === 0 && !questionsLoading) {
      setStep("summary");
    }
  }, [step, orderedQuestions.length, questionsLoading]);

  // --- Derived state ---

  const scheduleValid =
    !collectSchedule ||
    (!!scheduledDate && !!scheduledStartTime && !!scheduledEndTime && (durationMinutes ?? 0) > 0);
  const currentQuestion = orderedQuestions[currentQuestionIndex];
  const totalQuestionSteps = orderedQuestions.length;
  const isLastQuestion = currentQuestionIndex >= totalQuestionSteps - 1;

  // --- Handlers ---

  const handleSelectOffering = (offering: WelperProfileDialogOffering) => {
    setSelectedOffering(offering);
    onSelectOffering?.(offering);
    setStep(collectSchedule ? "schedule" : "questions");
    setCurrentQuestionIndex(0);
  };

  const handleNext = () => {
    if (step === "select" && !hasMultipleOfferings && effectiveOffering) {
      handleSelectOffering(effectiveOffering);
      return;
    }
    if (step === "schedule") {
      setStep(orderedQuestions.length > 0 ? "questions" : "summary");
      setCurrentQuestionIndex(0);
      return;
    }
    if (step === "questions") {
      if (questionsLoading) return;
      if (isLastQuestion) {
        setStep("summary");
      } else {
        setCurrentQuestionIndex((i) => i + 1);
      }
    }
  };

  const handleBack = () => {
    if (step === "questions" && currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1);
    } else if (step === "questions") {
      setStep(collectSchedule ? "schedule" : "select");
      setCurrentQuestionIndex(0);
    } else if (step === "schedule") {
      setStep("select");
    } else if (step === "summary") {
      if (totalQuestionSteps > 0) {
        setStep("questions");
        setCurrentQuestionIndex(totalQuestionSteps - 1);
      } else if (collectSchedule) {
        setStep("schedule");
      } else {
        setStep("select");
      }
    }
  };

  const handleSubmit = () => {
    if (!profile || !effectiveOffering) return;
    if (collectSchedule && !scheduleValid) return;
    onSubmit({
      welperId: profile.welperId,
      offering: effectiveOffering,
      answers,
      ...(collectSchedule &&
        scheduledDate &&
        scheduledStartTime &&
        scheduledEndTime &&
        (durationMinutes ?? 0) > 0 && {
          scheduledDate,
          scheduledStartTime: scheduledStartTime.slice(0, 5),
          scheduledEndTime: scheduledEndTime.slice(0, 5),
          durationMinutes: durationMinutes ?? undefined,
        }),
    });
    setStep("success");
  };

  const handleClose = () => {
    onOpenChange(false);
    setStep("select");
    setSelectedOffering(initialOffering ?? null);
    setCurrentQuestionIndex(0);
    setScheduledDate("");
    setScheduledStartTime("");
    setScheduledEndTime("");
  };

  // --- Render ---

  const displayName =
    profile && [profile.firstName, profile.lastName].filter(Boolean).length > 0
      ? [profile.firstName, profile.lastName].filter(Boolean).join(" ")
      : "Welper";

  const title =
    step === "success"
      ? "Request sent"
      : step === "summary"
        ? "Review and confirm"
        : step === "schedule"
          ? "Choose date and time"
          : step === "questions"
            ? `Question ${currentQuestionIndex + 1} of ${totalQuestionSteps}`
            : "Book a service";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={title} description={step === "success" ? undefined : `Booking with ${displayName}`}>
        <Flex direction="column" gap="5" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          {step === "success" && (
            <>
              <Text size="2" color="gray" highContrast>
                Your booking request has been sent. The Welper will respond shortly.
              </Text>
              <Button size="2" color={SEMANTIC_COLOR.primary} onClick={handleClose}>
                Close
              </Button>
            </>
          )}

          {step !== "success" && profileLoading && (
            <>
              <Skeleton width="100%" height="40px" />
              <Skeleton width="100%" height="80px" />
            </>
          )}

          {step !== "success" && !profileLoading && profile && (
            <>
              {step === "select" && (
                <SelectOfferingStep
                  offerings={offerings}
                  hasMultiple={hasMultipleOfferings}
                  onSelect={handleSelectOffering}
                />
              )}

              {step === "schedule" && (
                <ScheduleStep
                  scheduledDate={scheduledDate}
                  scheduledStartTime={scheduledStartTime}
                  scheduledEndTime={scheduledEndTime}
                  durationMinutes={durationMinutes}
                  onDateChange={setScheduledDate}
                  onStartTimeChange={setScheduledStartTime}
                  onEndTimeChange={setScheduledEndTime}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}

              {step === "questions" && (
                <QuestionsStep
                  currentQuestion={currentQuestion}
                  questionsLoading={questionsLoading}
                  answers={answers}
                  onAnswerChange={onAnswerChange}
                  isLastQuestion={isLastQuestion}
                  onBack={handleBack}
                  onNext={handleNext}
                />
              )}

              {step === "summary" && effectiveOffering && (
                <SummaryStep
                  offering={effectiveOffering}
                  collectSchedule={collectSchedule}
                  scheduledDate={scheduledDate}
                  scheduledStartTime={scheduledStartTime}
                  scheduledEndTime={scheduledEndTime}
                  durationMinutes={durationMinutes}
                  orderedQuestions={orderedQuestions}
                  answers={answers}
                  submitLoading={submitLoading}
                  scheduleValid={scheduleValid}
                  onBack={handleBack}
                  onSubmit={handleSubmit}
                />
              )}
            </>
          )}

          {step !== "success" && !profileLoading && !profile && (
            <Text size="2" color="gray" highContrast>
              Could not load profile.
            </Text>
          )}
        </Flex>
      </DialogContent>
    </Dialog>
  );
}
