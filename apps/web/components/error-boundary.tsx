"use client";

import { Component, ReactNode } from "react";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Button } from "@welpco/ui/button";
import { Card } from "@welpco/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    // Log error to error reporting service (e.g., Sentry)
    console.error("Error caught by boundary:", error, errorInfo);
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback && this.state.error) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return (
        <Card size="4" variant="surface" style={{ maxWidth: "600px", margin: "0 auto" }}>
          <Flex direction="column" gap="4" align="center" style={{ textAlign: "center" }}>
            <Box>
              <AlertCircle size={48} color="var(--red-9)" />
            </Box>
            <Box>
              <Heading size="6" mb="2">
                Something went wrong
              </Heading>
              <Text size="2" color="gray">
                We encountered an unexpected error. Please try refreshing the page.
              </Text>
            </Box>
            {this.state.error && process.env.NODE_ENV === "development" && (
              <Card size="2" variant="surface" style={{ width: "100%", textAlign: "left" }}>
                <Text size="1" color="red" style={{ fontFamily: "monospace" }}>
                  {this.state.error.message}
                </Text>
              </Card>
            )}
            <Flex gap="3" wrap="wrap" justify="center">
              <Button onClick={this.reset} variant="soft" color="gray">
                Try again
              </Button>
              <Button onClick={() => window.location.reload()} color="green">
                Refresh page
              </Button>
            </Flex>
          </Flex>
        </Card>
      );
    }

    return this.props.children;
  }
}
