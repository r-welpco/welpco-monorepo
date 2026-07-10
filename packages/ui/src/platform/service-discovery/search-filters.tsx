"use client";

import { Card } from "@welpco/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { TextField } from "@welpco/ui/text-field";
import { Slider } from "@welpco/ui/slider";
import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Text } from "@welpco/ui/text";
import { Heading } from "@welpco/ui/heading";
import { Badge } from "@welpco/ui/badge";
import { FORM_SPACING } from "@welpco/ui/tokens";

export interface SearchFiltersState {
  priceRange: "any" | "0-50" | "50-100" | "100-200" | "200+";
  rating: "any" | "4" | "4.5" | "5";
  location?: string;
  radius: number;
}

export interface SearchFiltersProps {
  value: SearchFiltersState;
  onChange?: (value: SearchFiltersState) => void;
}

const priceOptions: SearchFiltersState["priceRange"][] = [
  "any",
  "0-50",
  "50-100",
  "100-200",
  "200+",
];

const ratingOptions: SearchFiltersState["rating"][] = ["any", "4", "4.5", "5"];

export function SearchFilters({ value, onChange }: SearchFiltersProps) {
  const update = (patch: Partial<SearchFiltersState>) => {
    onChange?.({ ...value, ...patch });
  };

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "840px", minWidth: 0 }}
    >
      <Flex direction="column" gap="6" style={{ minWidth: 0 }}>
        <Box>
          <Heading size="5" mb="1" trim="start">
            Filters
          </Heading>
          <Text size="2" color="gray" highContrast>
            Refine your search by location, price, and rating.
          </Text>
        </Box>

        <Flex direction="column" gap="4">
          {/* Location Filter */}
          <Box>
            <Text as="label" size="2" weight="medium" htmlFor="filter-location" mb={FORM_SPACING.labelGap} style={{ display: "block" }}>
              Location
            </Text>
            <TextField.Root
              id="filter-location"
              placeholder="Enter city or postal code"
              value={value.location || ""}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                update({ location: e.target.value });
              }}
              size="3"
              style={{ width: "100%" }}
            />
          </Box>

          {/* Radius Slider */}
          <Box>
            <Flex justify="between" align="center" mb="2">
              <Text as="label" size="2" weight="medium" htmlFor="filter-radius">
                Search radius
              </Text>
              <Badge color="green" variant="soft" size="1" highContrast>
                {value.radius} km
              </Badge>
            </Flex>
            <Slider
              id="filter-radius"
              aria-label="Search radius in kilometres"
              value={[value.radius]}
              onValueChange={(vals) => update({ radius: vals[0] })}
              min={5}
              max={100}
              step={5}
              size="2"
              style={{ width: "100%" }}
            />
            <Flex justify="between" mt="2">
              <Text size="1" color="gray" highContrast>5 km</Text>
              <Text size="1" color="gray" highContrast>100 km</Text>
            </Flex>
          </Box>

          {/* Price Range - label and select same row */}
          <Flex align="center" justify="between" gap="4" wrap="wrap">
            <Text as="label" size="2" weight="medium" id="filter-price-label" htmlFor="filter-price" style={{ display: "block" }}>
              Price range
            </Text>
            <Box style={{ flex: 1, minWidth: 0, maxWidth: 280 }}>
              <Select
                value={value.priceRange}
                onValueChange={(val) =>
                  update({ priceRange: val as SearchFiltersState["priceRange"] })
                }
              >
                <SelectTrigger id="filter-price" aria-labelledby="filter-price-label" style={{ width: "100%" }} />
                <SelectContent>
                  {priceOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "any" ? "Any price" : `$${option}/hr`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          </Flex>

          {/* Rating - label and select same row */}
          <Flex align="center" justify="between" gap="4" wrap="wrap">
            <Text as="label" size="2" weight="medium" id="filter-rating-label" htmlFor="filter-rating" style={{ display: "block" }}>
              Minimum rating
            </Text>
            <Box style={{ flex: 1, minWidth: 0, maxWidth: 280 }}>
              <Select
                value={value.rating}
                onValueChange={(val) =>
                  update({ rating: val as SearchFiltersState["rating"] })
                }
              >
                <SelectTrigger id="filter-rating" aria-labelledby="filter-rating-label" style={{ width: "100%" }} />
                <SelectContent>
                  {ratingOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option === "any" ? "Any rating" : `${option}+ stars`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          </Flex>
        </Flex>
      </Flex>
    </Card>
  );
}
