import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Skeleton } from "@welpco/ui/skeleton";

export default function SearchLoading() {
  return (
    <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
      <Box>
        <Skeleton width="200px" height="36px" style={{ marginBottom: 8 }} />
        <Skeleton width="320px" height="20px" />
      </Box>
      <Flex gap="4" direction={{ initial: "column", md: "row" }}>
        <Skeleton width="100%" height="280px" style={{ flex: "2 1 400px" }} />
        <Skeleton width="100%" height="320px" style={{ flex: "1 1 280px" }} />
      </Flex>
      <Flex direction="column" gap="4">
        <Flex justify="between" gap="3">
          <Skeleton width="180px" height="32px" />
          <Skeleton width="120px" height="32px" />
        </Flex>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width="100%" height="88px" />
        ))}
      </Flex>
    </Flex>
  );
}
