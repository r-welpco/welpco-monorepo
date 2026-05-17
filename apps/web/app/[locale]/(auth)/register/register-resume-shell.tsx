"use client";

import { type ReactNode } from "react";
import { Card } from "@welpco/ui/card";
import { Flex } from "@welpco/ui/flex";
import { Spinner } from "@welpco/ui/spinner";

const CARD_STYLE = {
  width: "100%",
  maxWidth: "560px",
  minWidth: 0,
} as const;

type RegisterResumeShellProps = {
  children?: ReactNode;
  loading?: boolean;
};

/** Card wrapper for loading/error while resuming signup (account banner lives in layout). */
export function RegisterResumeShell({
  children,
  loading = false,
}: RegisterResumeShellProps) {
  return (
    <Card size="4" variant="surface" style={CARD_STYLE}>
      <Flex direction="column" gap="4">
        {loading ? (
          <Flex justify="center" py="4" aria-busy>
            <Spinner size="3" />
          </Flex>
        ) : null}
        {children}
      </Flex>
    </Card>
  );
}
