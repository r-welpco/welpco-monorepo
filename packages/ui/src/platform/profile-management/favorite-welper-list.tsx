"use client";

import { Card } from "@welpco/ui/card";
import { Button } from "@welpco/ui/button";
import { TextField } from "@welpco/ui/text-field";
import { Box } from "@welpco/ui/box";
import { Flex } from "@welpco/ui/flex";
import { Heading } from "@welpco/ui/heading";
import { Text } from "@welpco/ui/text";
import { Badge } from "@welpco/ui/badge";
import { Avatar } from "@welpco/ui/avatar";
import { Grid } from "@welpco/ui/grid";
import { SEMANTIC_COLOR } from "@welpco/ui/tokens";
import { FavoriteWelperCard } from "./favorite-welper-card";
import { useState } from "react";
import { Search, Calendar, Heart } from "lucide-react";

export interface FavoriteWelper {
  id: string;
  name: string;
  role: string;
  location: string;
  rating?: number;
  completedJobs?: number;
  imageUrl?: string;
  lastBooked?: Date;
}

export type FavoriteWelperListLabels = {
  emptyTitle: string;
  emptyDescription: string;
  heading: string;
  headingDescription: string;
  searchPlaceholder: string;
  showingCount: (shown: number, total: number) => string;
  noMatchTitle: string;
  noMatchDescription: string;
  jobsCompleted: (count: number) => string;
  lastBooked: (date: string) => string;
  viewProfile: string;
  remove: string;
  quickRebook: string;
};

const DEFAULT_LABELS: FavoriteWelperListLabels = {
  emptyTitle: "No favorite Welpers yet",
  emptyDescription:
    "Start booking services to build your list of favorite Welpers for quick rebooking.",
  heading: "Favorite Welpers",
  headingDescription: "Your saved Welpers for quick rebooking.",
  searchPlaceholder: "Search favorites...",
  showingCount: (shown, total) => `Showing ${shown} of ${total} favorites`,
  noMatchTitle: "No favorites match your search",
  noMatchDescription: "Try adjusting your search query.",
  jobsCompleted: (count) => `${count} jobs completed`,
  lastBooked: (date) => `Last booked: ${date}`,
  viewProfile: "View profile",
  remove: "Remove",
  quickRebook: "Quick rebook",
};

export interface FavoriteWelperListProps {
  favorites: FavoriteWelper[];
  loading?: boolean;
  labels?: FavoriteWelperListLabels;
  onRemove?: (id: string) => void;
  onViewProfile?: (id: string) => void;
  onQuickRebook?: (id: string) => void;
  viewMode?: "grid" | "list";
}

export function FavoriteWelperList({
  favorites,
  loading,
  labels: labelsProp,
  onRemove,
  onViewProfile,
  onQuickRebook,
  viewMode = "grid",
}: FavoriteWelperListProps) {
  const labels = labelsProp ?? DEFAULT_LABELS;
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFavorites = favorites.filter(
    (favorite) =>
      searchQuery === "" ||
      favorite.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (favorites.length === 0) {
    return (
      <Card
        size="4"
        variant="surface"
        style={{ width: "100%", maxWidth: "1200px", minWidth: 0 }}
      >
        <Flex direction="column" align="center" gap="4" py="15" px="9" style={{ minWidth: 0 }}>
          <Flex
            align="center"
            justify="center"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "9999px",
              backgroundColor: "var(--gray-3)",
            }}
          >
            <Heart aria-hidden="true" style={{ width: "40px", height: "40px", color: "var(--gray-9)" }} />
          </Flex>
          <Box>
            <Heading size="4" mb="1" align="center">
              {labels.emptyTitle}
            </Heading>
            <Text size="2" color="gray" align="center" highContrast>
              {labels.emptyDescription}
            </Text>
          </Box>
        </Flex>
      </Card>
    );
  }

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
              {labels.heading}
            </Heading>
            <Text size="2" color="gray" highContrast>
              {labels.headingDescription}
            </Text>
          </Box>
        </Flex>

        {/* Search */}
        <Box style={{ width: "100%", maxWidth: "400px" }}>
          <TextField.Root
            placeholder={labels.searchPlaceholder}
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

        {/* Results count */}
        <Text size="2" color="gray" highContrast>
          {labels.showingCount(filteredFavorites.length, favorites.length)}
        </Text>

        {/* Favorites grid/list */}
        {filteredFavorites.length === 0 ? (
          <Card size="3" variant="surface">
            <Flex direction="column" align="center" gap="3" p="9">
              <Text size="4" color="gray" align="center" highContrast>
                {labels.noMatchTitle}
              </Text>
              <Text size="2" color="gray" align="center" highContrast>
                {labels.noMatchDescription}
              </Text>
            </Flex>
          </Card>
        ) : viewMode === "grid" ? (
          <Grid columns={{ initial: "1", sm: "2", lg: "3" }} gap="4">
            {filteredFavorites.map((favorite) => (
              <FavoriteWelperCard
                key={favorite.id}
                name={favorite.name}
                role={favorite.role}
                location={favorite.location}
                rating={favorite.rating}
                completedJobs={favorite.completedJobs}
                isFavorite={true}
                onToggleFavorite={() => onRemove?.(favorite.id)}
                onViewProfile={() => onViewProfile?.(favorite.id)}
              />
            ))}
          </Grid>
        ) : (
          <Flex direction="column" gap="3">
            {filteredFavorites.map((favorite) => (
              <Card key={favorite.id} size="3" variant="surface">
                <Flex
                  align="center"
                  justify="between"
                  gap="4"
                  direction={{ initial: "column", sm: "row" }}
                  wrap="wrap"
                >
                  <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
                    <Avatar
                      src={favorite.imageUrl}
                      alt={favorite.name}
                      fallback={favorite.name.charAt(0)}
                      size="6"
                    />
                    <Box style={{ flex: 1 }}>
                      <Heading size="4" mb="1">
                        {favorite.name}
                      </Heading>
                      <Flex gap="2" align="center" wrap="wrap" mb="1">
                        <Badge color="blue" variant="soft" size="2">
                          {favorite.role}
                        </Badge>
                        <Text size="2" color="gray" highContrast>
                          {favorite.location}
                        </Text>
                      </Flex>
                      <Flex gap="2" align="center">
                        {typeof favorite.rating === "number" && (
                          <Text size="2" weight="bold">
                            {favorite.rating.toFixed(1)} ★
                          </Text>
                        )}
                        {favorite.completedJobs !== undefined && (
                          <Text size="2" color="gray" highContrast>
                            {labels.jobsCompleted(favorite.completedJobs)}
                          </Text>
                        )}
                        {favorite.lastBooked && (
                          <Text size="2" color="gray" highContrast>
                            {labels.lastBooked(favorite.lastBooked.toLocaleDateString())}
                          </Text>
                        )}
                      </Flex>
                    </Box>
                  </Flex>

                  <Flex gap="2" justify="end" wrap="wrap" style={{ flexShrink: 0 }}>
                    {onViewProfile && (
                      <Button
                        size="2"
                        variant="outline"
                        onClick={() => onViewProfile(favorite.id)}
                        disabled={loading}
                      >
                        {labels.viewProfile}
                      </Button>
                    )}
                    {onRemove && (
                      <Button
                        size="2"
                        variant="ghost"
                        color={SEMANTIC_COLOR.danger}
                        onClick={() => onRemove(favorite.id)}
                        disabled={loading}
                      >
                        {labels.remove}
                      </Button>
                    )}
                    {onQuickRebook && (
                      <Button
                        size="2"
                        color={SEMANTIC_COLOR.primary}
                        onClick={() => onQuickRebook(favorite.id)}
                        disabled={loading}
                      >
                        <Flex align="center" gap="2">
                          <Calendar style={{ width: "16px", height: "16px" }} />
                          {labels.quickRebook}
                        </Flex>
                      </Button>
                    )}
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Flex>
        )}
      </Flex>
    </Card>
  );
}

