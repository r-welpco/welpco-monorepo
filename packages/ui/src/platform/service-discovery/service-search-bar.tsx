"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Separator } from "@welpco/ui/separator";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, type ChangeEvent } from "react";

export interface ServiceSearchBarProps {
  /** Main heading above the search (e.g. "Find a Welper") */
  title?: string;
  /** Short description under the title */
  description?: string;
  placeholder?: string;
  suggestions?: string[];
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export function ServiceSearchBar({
  title = "Find a Welper",
  description = "Search by service, skill, or name. Get started in minutes.",
  placeholder = "e.g. pet care, tutoring, handyman...",
  suggestions = [],
  loading,
  onSearch,
}: ServiceSearchBarProps) {
  const [query, setQuery] = useState("");

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(query.trim());
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "840px", minWidth: 0 }}
    >
      <Flex direction="column" gap="6" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="8" weight="bold" trim="start" mb="3">
            {title}
          </Heading>
          <Text size="3" color="gray" highContrast>
            {description}
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <Flex gap="3" align="end" direction={{ initial: "column", sm: "row" }}>
            <Box style={{ flex: 1, width: "100%", minWidth: 0 }}>
              <Text as="label" size="2" weight="bold" htmlFor="service-search" mb="2" style={{ display: "block" }}>
                Search for services
              </Text>
              <TextField.Root
                id="service-search"
                placeholder={placeholder}
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => {
                  const target = event.target as HTMLInputElement;
                  setQuery(target.value);
                }}
                size="3"
                disabled={loading}
                style={{ width: "100%" }}
                aria-label="Search services or Welpers"
              />
            </Box>
            <Button
              type="submit"
              size="3"
              color={SEMANTIC_COLOR.primary}
              variant="solid"
              disabled={loading || !query.trim()}
              style={{ minWidth: 140 }}
            >
              {loading ? "Searching…" : "Search"}
            </Button>
          </Flex>
        </form>

        {suggestions.length > 0 && (
          <Box mt="2">
            <Separator size="4" mb="4" />
            <Text as="p" size="2" weight="bold" mb="3" color="gray" highContrast>
              Popular searches
            </Text>
            <Flex gap="2" wrap="wrap">
              {suggestions.map((suggestion) => (
                <Button
                  key={suggestion}
                  variant="soft"
                  color={SEMANTIC_COLOR.primary}
                  size="2"
                  onClick={() => {
                    setQuery(suggestion);
                    onSearch?.(suggestion);
                  }}
                >
                  {suggestion}
                </Button>
              ))}
            </Flex>
          </Box>
        )}
      </Flex>
    </Card>
  );
}
