import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Skeleton } from "@welpco/ui/skeleton";

export default function DashboardLoading() {
  return (
    <Flex direction="column" gap="6" style={{ width: "100%", minWidth: 0 }}>
      <Box>
        <Skeleton width="240px" height="36px" style={{ marginBottom: 8 }} />
        <Skeleton width="60%" height="20px" />
      </Box>
      <Flex gap="4" wrap="wrap">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="280px" height="120px" style={{ flex: "1 1 200px" }} />
        ))}
      </Flex>
      <Skeleton width="100%" height="200px" />
    </Flex>
  );
}
