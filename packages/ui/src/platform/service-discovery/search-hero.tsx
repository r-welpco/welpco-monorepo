"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState, type ChangeEvent, useEffect } from "react";
import { Search, MapPin } from "lucide-react";

export interface SearchHeroCategory {
  id: string;
  label: string;
  /** Optional count for badge */
  count?: number;
}

export interface SearchHeroProps {
  /** Controlled query (e.g. from URL) */
  value?: string;
  /** Called when query changes (e.g. update URL) */
  onChange?: (query: string) => void;
  /** Called on form submit or pill/suggestion select */
  onSearch?: (query: string) => void;
  title?: string;
  description?: string;
  placeholder?: string;
  /** Category pills shown below search. */
  categories?: SearchHeroCategory[];
  /** When user clicks a category pill, call with category id (sets category filter, not search text). */
  onCategorySelect?: (categoryId: string) => void;
  /** Quick search suggestions */
  suggestions?: string[];
  loading?: boolean;
  /** When true, card fills container width (e.g. in dashboard row with Filters). */
  fillWidth?: boolean;
  /** Accessibility: live region for result count or status */
  "aria-live"?: "polite" | "off";
  /** When "location", the main input is for postal code and "Use my location" is shown. When "keyword", current search-by-text behavior. */
  mode?: "location" | "keyword";
  /** For mode="location": called when user clicks "Use my location". */
  onUseMyLocation?: () => void;
  /** For mode="location": error message (e.g. geolocation denied). */
  locationError?: string | null;
  /** For mode="location": true while resolving location. */
  locationLoading?: boolean;
}

const LOCATION_PLACEHOLDER = "Enter postal code (e.g. H2X 1Y4)";
const LOCATION_DESCRIPTION = "Enter your postal code or use your location to find Welpers nearby.";
const KEYWORD_PLACEHOLDER = "e.g. pet care, tutoring, handyman…";
const KEYWORD_DESCRIPTION = "Search by service, skill, or name. Browse categories or use filters.";

/**
 * Discovery entry point. Hero card on search/landing pages.
 *
 * Canonical card pattern (bible §25.6): card-as-surface with a heading,
 * single dominant search affordance, and supporting category/suggestion
 * pills. No absolute-positioned icons — uses `TextField.Slot` instead.
 */
export function SearchHero({
  value: controlledValue,
  onChange,
  onSearch,
  title = "Find your Welper",
  description,
  placeholder,
  categories = [],
  onCategorySelect,
  suggestions = [],
  loading = false,
  fillWidth = false,
  "aria-live": ariaLive = "off",
  mode = "keyword",
  onUseMyLocation,
  locationError = null,
  locationLoading = false,
}: SearchHeroProps) {
  const isLocationMode = mode === "location";
  const resolvedPlaceholder = placeholder ?? (isLocationMode ? LOCATION_PLACEHOLDER : KEYWORD_PLACEHOLDER);
  const resolvedDescription = description ?? (isLocationMode ? LOCATION_DESCRIPTION : KEYWORD_DESCRIPTION);

  const [localQuery, setLocalQuery] = useState(controlledValue ?? "");
  const isControlled = controlledValue !== undefined;
  const query = isControlled ? controlledValue : localQuery;

  useEffect(() => {
    if (isControlled && controlledValue !== localQuery) {
      setLocalQuery(controlledValue);
    }
  }, [isControlled, controlledValue]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (!isControlled) setLocalQuery(v);
    onChange?.(v);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(query.trim());
  };

  const runSearch = (q: string) => {
    if (!isControlled) setLocalQuery(q);
    onChange?.(q);
    onSearch?.(q);
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{
        width: "100%",
        minWidth: 0,
        maxWidth: fillWidth ? "100%" : "720px",
      }}
    >
      <Flex direction="column" gap="5">
        <Box>
          <Heading size="6" mb="2" trim="start">
            {title}
          </Heading>
          <Text size="2" color="gray" highContrast>
            {resolvedDescription}
          </Text>
        </Box>

        <Box asChild>
          <form onSubmit={handleSubmit}>
            <Flex gap="2" direction={{ initial: "column", sm: "row" }}>
              <Box style={{ flex: 1, width: "100%", minWidth: 0 }}>
                <TextField.Root
                  placeholder={resolvedPlaceholder}
                  value={query}
                  onChange={handleChange}
                  size="3"
                  disabled={loading}
                  aria-label={isLocationMode ? "Postal code" : "Search services or Welpers"}
                  aria-live={ariaLive}
                >
                  <TextField.Slot>
                    <Search size={18} aria-hidden="true" />
                  </TextField.Slot>
                </TextField.Root>
              </Box>
              <Flex gap="2" wrap="wrap">
                <Button
                  type="submit"
                  size="3"
                  color={SEMANTIC_COLOR.primary}
                  disabled={loading || !query.trim()}
                >
                  {loading ? "Searching…" : "Search"}
                </Button>
                {isLocationMode && onUseMyLocation && (
                  <Button
                    type="button"
                    size="3"
                    variant="soft"
                    color="gray"
                    onClick={onUseMyLocation}
                    disabled={locationLoading}
                  >
                    <Flex align="center" gap="2">
                      <MapPin size={16} aria-hidden="true" />
                      <span>{locationLoading ? "Detecting…" : "Use my location"}</span>
                    </Flex>
                  </Button>
                )}
              </Flex>
            </Flex>
            {isLocationMode && locationError && (
              <Text
                size="1"
                color={SEMANTIC_COLOR.danger}
                mt="2"
                role="alert"
                as="p"
              >
                {locationError}
              </Text>
            )}
          </form>
        </Box>

        {categories.length > 0 && (
          <Box>
            <Text as="p" size="2" weight="bold" mb="2" id="category-pills-label">
              Browse by category
            </Text>
            <Flex gap="2" wrap="wrap" role="group" aria-labelledby="category-pills-label">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  type="button"
                  variant="soft"
                  color="gray"
                  size="2"
                  highContrast
                  onClick={() =>
                    onCategorySelect ? onCategorySelect(cat.id) : runSearch(cat.label)
                  }
                  aria-label={`Search in ${cat.label} category`}
                >
                  {cat.label}
                  {cat.count !== undefined && cat.count > 0 && (
                    <Text as="span" ml="2" size="1" color="gray" highContrast aria-label={`${cat.count} welpers`}>
                      {cat.count}
                    </Text>
                  )}
                </Button>
              ))}
            </Flex>
          </Box>
        )}

        {suggestions.length > 0 && (
          <Box>
            <Text size="2" weight="bold" mb="2" as="p">
              Suggestions
            </Text>
            <Flex gap="2" wrap="wrap">
              {suggestions.map((s) => (
                <Button
                  key={s}
                  type="button"
                  variant="ghost"
                  color="gray"
                  size="2"
                  onClick={() => runSearch(s)}
                >
                  {s}
                </Button>
              ))}
            </Flex>
          </Box>
        )}
      </Flex>
    </Card>
  );
}

SearchHero.displayName = "SearchHero";
