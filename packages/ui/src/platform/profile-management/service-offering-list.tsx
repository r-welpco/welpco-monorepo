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
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { useState } from "react";
import { Plus, Edit, Trash2, Search, Filter, Briefcase } from "lucide-react";

export interface ServiceOffering {
  id: string;
  title: string;
  /** Human-readable category label (preferred for display). */
  categoryName: string;
  /** Category id for filtering; falls back to `category` when omitted. */
  categoryId?: string;
  /** @deprecated Use `categoryName` + `categoryId`. Kept for backwards compatibility. */
  category?: string;
  subcategories?: Array<{ id: string; name: string }>;
  hourlyRate: number;
  experienceYears?: number;
  description?: string;
  rating?: number;
  reviewsCount?: number;
  active: boolean;
}

export type ServiceOfferingListLabels = {
  listTitle: string;
  listDescription: string;
  addOffering: string;
  searchPlaceholder: string;
  active: string;
  inactive: string;
  edit: string;
  delete: string;
  activeLabel: string;
  uncategorized?: string;
  allCategories?: string;
  allStatus?: string;
  activeOnly?: string;
  inactiveOnly?: string;
  filterByCategoryAria?: string;
  filterByStatusAria?: string;
  showingCount?: (shown: number, total: number) => string;
  noOfferingsFound?: string;
  emptyFirst?: string;
  emptyFiltered?: string;
};

export interface ServiceOfferingListProps {
  offerings: ServiceOffering[];
  loading?: boolean;
  onAdd?: () => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onBook?: (id: string) => void;
  serviceCategories?: Array<{ id: string; name: string }>;
  labels?: ServiceOfferingListLabels;
}

function offeringCategoryKey(offering: ServiceOffering): string {
  return offering.categoryId ?? offering.category ?? "";
}

function offeringCategoryLabel(offering: ServiceOffering, uncategorized = "Uncategorized"): string {
  return offering.categoryName || offering.category || uncategorized;
}

function ServiceOfferingRow({
  offering,
  loading,
  onEdit,
  onDelete,
  onToggleActive,
  onBook,
  labels,
}: {
  offering: ServiceOffering;
  loading?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onBook?: (id: string) => void;
  labels?: ServiceOfferingListLabels;
}) {
  const subcategories = offering.subcategories ?? [];

  return (
    <Card
      size="3"
      variant="surface"
      style={{ width: "100%", minWidth: 0 }}
    >
      <Flex
        direction={{ initial: "column", sm: "row" }}
        gap="4"
        align={{ initial: "stretch", sm: "start" }}
        justify="between"
      >
        <Box flexGrow="1" style={{ minWidth: 0 }}>
          <Flex align="center" gap="2" wrap="wrap" mb="2">
            <Heading size="4" trim="start" mb="0">
              {offering.title}
            </Heading>
            <Badge
              color={offering.active ? "green" : "gray"}
              variant={offering.active ? "solid" : "soft"}
              size="1"
            >
              {offering.active ? (labels?.active ?? "Active") : (labels?.inactive ?? "Inactive")}
            </Badge>
          </Flex>

          <Flex gap="2" wrap="wrap" align="center" mb={offering.description ? "2" : "0"}>
            <Badge color={SEMANTIC_COLOR.primary} variant="soft" size="1">
              {offeringCategoryLabel(offering, labels?.uncategorized)}
            </Badge>
            {subcategories.map((sub) => (
              <Badge key={sub.id} color="gray" variant="outline" size="1">
                {sub.name}
              </Badge>
            ))}
          </Flex>

          {offering.description ? (
            <Text
              size="2"
              color="gray"
              highContrast
              style={{
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {offering.description}
            </Text>
          ) : null}

          {(typeof offering.rating === "number" || offering.reviewsCount !== undefined) && (
            <Flex align="center" gap="2" mt="2">
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
          )}
        </Box>

        <Flex
          direction="column"
          gap="3"
          align={{ initial: "stretch", sm: "end" }}
          style={{ flexShrink: 0, minWidth: "140px" }}
        >
          <Text size="4" weight="bold" color={SEMANTIC_COLOR.primary} align={{ initial: "left", sm: "right" }}>
            ${offering.hourlyRate}/hr
          </Text>

          <Flex align="center" justify="between" gap="3">
            <Text size="2" weight="medium" id={`offering-${offering.id}-active-label`}>
              {labels?.activeLabel ?? "Active"}
            </Text>
            <Switch
              aria-labelledby={`offering-${offering.id}-active-label`}
              checked={offering.active}
              onCheckedChange={(checked) => onToggleActive?.(offering.id, checked)}
              disabled={loading}
            />
          </Flex>

          <Flex gap="2" justify={{ initial: "start", sm: "end" }} wrap="wrap" align="center">
            {onEdit && (
              <Button
                size="2"
                variant="outline"
                onClick={() => onEdit(offering.id)}
                disabled={loading}
                aria-label={`Edit ${offering.title}`}
              >
                <Flex align="center" gap="2">
                  <Edit aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                  {labels?.edit ?? "Edit"}
                </Flex>
              </Button>
            )}
            {onDelete && (
              <Button
                size="2"
                variant="outline"
                color={SEMANTIC_COLOR.danger}
                onClick={() => onDelete(offering.id)}
                disabled={loading}
                aria-label={`Delete ${offering.title}`}
              >
                <Flex align="center" gap="2">
                  <Trash2 aria-hidden="true" style={{ width: "16px", height: "16px" }} />
                  {labels?.delete ?? "Delete"}
                </Flex>
              </Button>
            )}
            {onBook && (
              <Button
                size="2"
                color={SEMANTIC_COLOR.primary}
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
  );
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
  labels,
}: ServiceOfferingListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState<"all" | "active" | "inactive">("all");

  const filteredOfferings = offerings.filter((offering) => {
    const categoryKey = offeringCategoryKey(offering);
    const categoryLabel = offeringCategoryLabel(offering, labels?.uncategorized);
    const subNames = (offering.subcategories ?? []).map((s) => s.name).join(" ");

    const matchesSearch =
      searchQuery === "" ||
      offering.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      categoryLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subNames.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offering.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      filterCategory === "all" || categoryKey === filterCategory;
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
    <Card size="4" variant="surface" style={{ width: "100%", minWidth: 0 }}>
      <Flex direction="column" gap="3" style={{ minWidth: 0 }}>
        <Flex align="center" justify="between" wrap="wrap" gap="3">
          <Box>
            <Heading size="4" mb="1">
              {labels?.listTitle ?? "Service offerings"}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {labels?.listDescription ??
                "Manage your service offerings. Active offerings appear in search results."}
            </Text>
          </Box>
          {onAdd && (
            <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onAdd} disabled={loading}>
              <Flex align="center" gap="2">
                <Plus style={{ width: "16px", height: "16px" }} />
                {labels?.addOffering ?? "Add offering"}
              </Flex>
            </Button>
          )}
        </Flex>

        <Flex gap="3" wrap="wrap" align="end">
          <Box style={{ flex: 1, minWidth: "200px" }}>
            <TextField.Root
              placeholder={labels?.searchPlaceholder ?? "Search offerings..."}
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
                <SelectTrigger
                  aria-label={labels?.filterByCategoryAria ?? "Filter by category"}
                  style={{ width: "100%" }}
                >
                  <Filter style={{ width: "16px", height: "16px" }} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{labels?.allCategories ?? "All categories"}</SelectItem>
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
              <SelectTrigger
                aria-label={labels?.filterByStatusAria ?? "Filter by status"}
                style={{ width: "100%" }}
              />
              <SelectContent>
                <SelectItem value="all">{labels?.allStatus ?? "All status"}</SelectItem>
                <SelectItem value="active">{labels?.activeOnly ?? "Active only"}</SelectItem>
                <SelectItem value="inactive">{labels?.inactiveOnly ?? "Inactive only"}</SelectItem>
              </SelectContent>
            </Select>
          </Box>
        </Flex>

        <Text size="2" color="gray" highContrast>
          {labels?.showingCount
            ? labels.showingCount(sortedOfferings.length, offerings.length)
            : `Showing ${sortedOfferings.length} of ${offerings.length} offerings`}
        </Text>

        {sortedOfferings.length === 0 ? (
          <Card size="3" variant="surface" style={{ width: "100%" }}>
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
                {labels?.noOfferingsFound ?? "No offerings found"}
              </Heading>
              <Text size="2" color="gray" align="center" highContrast>
                {offerings.length === 0
                  ? (labels?.emptyFirst ?? "Add your first service offering to get started.")
                  : (labels?.emptyFiltered ?? "Try adjusting your search or filters.")}
              </Text>
              {onAdd && offerings.length === 0 && (
                <Button size="2" color={SEMANTIC_COLOR.primary} onClick={onAdd}>
                  <Flex align="center" gap="2">
                    <Plus style={{ width: "16px", height: "16px" }} />
                    {labels?.addOffering ?? "Add offering"}
                  </Flex>
                </Button>
              )}
            </Flex>
          </Card>
        ) : (
          <Flex direction="column" gap="3" style={{ width: "100%" }}>
            {sortedOfferings.map((offering) => (
              <ServiceOfferingRow
                key={offering.id}
                offering={offering}
                loading={loading}
                onEdit={onEdit}
                onDelete={onDelete}
                onToggleActive={onToggleActive}
                onBook={onBook}
                labels={labels}
              />
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
