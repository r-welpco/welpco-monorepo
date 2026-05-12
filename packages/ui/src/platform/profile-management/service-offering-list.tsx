"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Badge } from "@welpco/ui/badge";
import { Switch } from "@welpco/ui/switch";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@welpco/ui/select";
import { Grid } from "@welpco/ui/grid";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";
import { Plus, Edit, Trash2, Search, Filter, Briefcase } from "lucide-react";

export interface ServiceOffering {
  id: string;
  title: string;
  category: string;
  hourlyRate: number;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  active: boolean;
}

export interface ServiceOfferingListProps {
  offerings: ServiceOffering[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onBook?: (id: string) => void;
  serviceCategories?: Array<{ id: string; name: string }>;
}

export function ServiceOfferingList({
  offerings,
  loading,
  onAdd,
  onEdit,
  onDelete,
  onToggleActive,
  onBook,
  serviceCategories = [],
}: ServiceOfferingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredOfferings = offerings.filter((offering) => {
    const matchesSearch =
      searchQuery === "" ||
      offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = filterCategory === "all" || offering.category === filterCategory;
    const matchesActive =
      filterActive === "all" ||
      (filterActive === "active" && offering.active) ||
      (filterActive === "inactive" && !offering.active);
    return matchesSearch && matchesCategory && matchesActive;
  });

  const sortedOfferings = [...filteredOfferings].sort((a, b) => {
    if (a.active !== b.active) return a.active ? -1 : 1;
    return a.title.localeCompare(b.title);
  });

  return (
    <Card
      size="4"
      variant="surface"
      style={{ width: "100%", maxWidth: "1200px", minWidth: 0 }}
    >
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Box>
            <Heading size="4" mb="1">
              Service offerings
            </Heading>
            <Text size="2" color="gray" highContrast>
              Manage your service offerings. Active offerings appear in search results.
            </Text>
          </Box>
          {onAdd && (
            <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onAdd} disabled={loading}>
              <Flex align="center" gap="2">
                <Plus style={{ width: "16px", height: "16px" }} />
                Add offering
              </Flex>
            </Button>
          )}
        </Flex>

        {/* Filters */}
        <Flex gap="3" wrap="wrap" align="end">
          <Box style={{ flex: 1, minWidth: "200px" }}>
            <TextField.Root
              placeholder="Search offerings..."
              size="2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={loading}
            >
              <TextField.Slot>
                <Search style={{ width: "16px", height: "16px" }} />
              </TextField.Slot>
            </TextField.Root>
          </Box>

          {serviceCategories.length > 0 && (
            <Box minWidth="150px">
              <Select
                value={filterCategory}
                onValueChange={setFilterCategory}
                disabled={loading}
              >
                <SelectTrigger aria-label="Filter by category">
                  <Filter style={{ width: "16px", height: "16px" }} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {serviceCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Box>
          )}

          <Box style={{ minWidth: "150px" }}>
            <Select
              value={filterActive}
              onValueChange={(value) =>
                setFilterActive(value as "all" | "active" | "inactive")
              }
              disabled={loading}
            >
              <SelectTrigger aria-label="Filter by status" />
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="inactive">Inactive only</SelectItem>
              </SelectContent>
            </Select>
          </Box>
        </Flex>

        {/* Results count */}
        <Text size="2" color="gray" highContrast>
          Showing {sortedOfferings.length} of {offerings.length} offerings
        </Text>

        {/* Offerings list */}
        {sortedOfferings.length === 0 ? (
          <Card size="3" variant="surface">
            <Flex direction="column" align="center" gap="3" p="9">
              <Flex
                align="center"
                justify="center"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "9999px",
                  backgroundColor: "var(--gray-3)",
                }}
              >
                <Briefcase aria-hidden="true" style={{ width: "32px", height: "32px", color: "var(--gray-9)" }} />
              </Flex>
              <Heading size="4" align="center" mb="1">
                No offerings found
              </Heading>
              <Text size="2" color="gray" align="center" highContrast>
                {offerings.length === 0
                  ? "Add your first service offering to get started."
                  : "Try adjusting your search or filters."}
              </Text>
              {onAdd && offerings.length === 0 && (
                <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onAdd}>
                  <Flex align="center" gap="2">
                    <Plus style={{ width: "16px", height: "16px" }} />
                    Add offering
                  </Flex>
                </Button>
              )}
            </Flex>
          </Card>
        ) : (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {sortedOfferings.map((offering) => (
              <Card key={offering.id} size="3" variant="surface">
                <Flex direction="column" gap="3">
                  <Flex align="start" justify="between" gap="2">
                    <Box style={{ flex: 1 }}>
                      <Flex align="center" gap="2" mb="2">
                        <Heading size="4" mb="1">
                          {offering.title}
                        </Heading>
                        <Badge
                          color={offering.active ? "green" : "gray"}
                          variant={offering.active ? "solid" : "soft"}
                          size="2"
                        >
                          {offering.active ? "Active" : "Inactive"}
                        </Badge>
                      </Flex>
                      <Badge color="gray" variant="soft" size="1" mb="2">
                        {offering.category}
                      </Badge>
                      <Text size="4" weight="bold" color={SEMANTIC_COLOR.primary}>
                        ${offering.hourlyRate}/hr
                      </Text>
                    </Box>
                  </Flex>

                  {offering.description && (
                    <Text size="2" color="gray" highContrast>
                      {offering.description}
                    </Text>
                  )}

                  <Flex align="center" justify="between" gap="2">
                    <Flex align="center" gap="2">
                      {typeof offering.rating === "number" && (
                        <Text size="2" weight="bold">
                          {offering.rating.toFixed(1)} ★
                        </Text>
                      )}
                      {offering.reviewsCount !== undefined && (
                        <Text size="2" color="gray" highContrast>
                          ({offering.reviewsCount} reviews)
                        </Text>
                      )}
                    </Flex>
                  </Flex>

                  <Flex gap="2" direction="column">
                    <Flex align="center" justify="between">
                      <Text size="2" weight="medium" id={`offering-${offering.id}-active-label`}>
                        Active status
                      </Text>
                      <Switch
                        aria-labelledby={`offering-${offering.id}-active-label`}
                        checked={offering.active}
                        onCheckedChange={(checked) =>
                          onToggleActive?.(offering.id, checked)
                        }
                        disabled={loading}
                      />
                    </Flex>

                    <Flex gap="2" justify="end" wrap="wrap">
                      {onEdit && (
                        <Button
                          size="2"
                          variant="outline"
                          onClick={() => onEdit(offering.id)}
                          disabled={loading}
                          aria-label={`Edit ${offering.title}`}
                        >
                          <Edit aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="2"
                          variant="ghost"
                          color={SEMANTIC_COLOR.danger}
                          onClick={() => onDelete(offering.id)}
                          disabled={loading}
                          aria-label={`Delete ${offering.title}`}
                        >
                          <Trash2 aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                        </Button>
                      )}
                      {onBook && (
                        <Button
                          size="2"
                          color={SEMANTIC_COLOR.primary}
                          style={{ flex: 1 }}
                          onClick={() => onBook(offering.id)}
                          disabled={!offering.active}
                        >
                          Book now
                        </Button>
                      )}
                    </Flex>
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Grid>
        )}
      </Flex>
    </Card>
  );
}

