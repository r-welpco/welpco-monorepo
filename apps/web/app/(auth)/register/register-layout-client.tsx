"use client";

import { useSession, signOut } from "next-auth/react";
import { Box } from "@welpco/ui/box";
import { Container } from "@welpco/ui/container";
import { Flex } from "@welpco/ui/flex";
import { Link } from "@welpco/ui/link";
import { Progress } from "@welpco/ui/progress";
import { Text } from "@welpco/ui/text";
import { AuthBackground } from "@welpco/ui/platform/user-management";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useSignupState } from "@/lib/hooks/use-signup";

/**
 * Day 15 — Phase 2 Dispatch A. Live wizard chrome.
 *
 * - Progress indicator at the top: "Step N of M" + visual bar.
 *   - Pre-auth (no session yet, step 1) shows "Step 1 of 7" without a bar
 *     (we don't know the role's full step count until select-role).
 *   - Authenticated reads `useSignupState()` and computes position from the
 *     server-owned `requiredSteps`/`completedSteps`.
 * - "Save and continue later" sign-out link (warm copy per bible §22).
 */
export default function RegisterLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const { status } = useSession();
  const isAuthenticated = status === "authenticated";
  const { data: state } = useSignupState();

  const totalSteps = state?.requiredSteps?.length ?? 7;
  const stepIndex = state
    ? Math.min(state.completedSteps.length + 1, totalSteps)
    : 1;
  const progressPct = state
    ? Math.round((state.completedSteps.length / Math.max(totalSteps, 1)) * 100)
    : 0;

  return (
    <AuthBackground>
      <Container size="2" style={{ width: "100%" }}>
        <Flex direction="column" gap="5" style={{ width: "100%" }}>
          <Box
            mx="auto"
            style={{
              width: "100%",
              maxWidth: "560px",
            }}
          >
            <Flex
              direction={{ initial: "column", sm: "row" }}
              gap="2"
              align={{ initial: "stretch", sm: "center" }}
              justify="between"
              mb="2"
            >
              <Text size="2" color="gray" weight="medium">
                Step {stepIndex} of {totalSteps}
              </Text>
              {isAuthenticated && (
                <Link
                  size="2"
                  weight="medium"
                  href="#"
                  onClick={async (e) => {
                    e.preventDefault();
                    await signOut({ callbackUrl: "/login" });
                  }}
                  style={{ cursor: "pointer" }}
                  aria-label="Save and continue later"
                >
                  Save and continue later
                </Link>
              )}
            </Flex>
            {isAuthenticated && state ? (
              <Progress
                value={progressPct}
                size="1"
                color={SEMANTIC_COLOR.primary}
                aria-label={`Signup progress: ${progressPct}%`}
              />
            ) : null}
            {isAuthenticated && (
              <Text
                size="1"
                color="gray"
                mt="2"
                style={{ display: "block" }}
              >
                Your progress is saved. Sign back in to pick up here.
              </Text>
            )}
          </Box>

          <Flex justify="center" style={{ width: "100%" }}>
            {children}
          </Flex>
        </Flex>
      </Container>
    </AuthBackground>
  );
}
