"use client";

import { useEffect } from "react";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { AlertCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "50vh", padding: "2rem" }}
    >
      <Card
        size="4"
        variant="surface"
        style={{ maxWidth: "500px", width: "100%" }}
      >
        <Flex direction="column" gap="4" align="center" style={{ textAlign: "center" }}>
          <Box>
            <AlertCircle size={48} color="var(--red-9)" />
          </Box>
          <Box>
            <Heading size="6" mb="2">
              Something went wrong
            </Heading>
            <Text size="2" color="gray">
              An unexpected error occurred. Please try again.
            </Text>
          </Box>
          {process.env.NODE_ENV === "development" && (
            <Card size="2" variant="surface" style={{ width: "100%", textAlign: "left" }}>
              <Text size="1" color="red" style={{ fontFamily: "monospace" }}>
                {error.message}
              </Text>
            </Card>
          )}
          <Flex gap="3">
            <Button onClick={reset} variant="soft" color="gray">
              Try again
            </Button>
            <Button onClick={() => (window.location.href = "/")} color="green">
              Go home
            </Button>
          </Flex>
        </Flex>
      </Card>
    </Flex>
  );
}
