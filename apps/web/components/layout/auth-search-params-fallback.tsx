import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { Skeleton } from "@welpco/ui/skeleton";

/** Shown while `useSearchParams()` resolves inside Suspense (auth pages, search redirect). */
export function AuthSearchParamsFallback() {
  return (
    <Flex
      align="center"
      justify="center"
      style={{ minHeight: "50vh", width: "100%" }}
      aria-busy
      aria-label="Loading"
    >
      <Box style={{ width: "100%", maxWidth: "400px", padding: "24px" }}>
        <Skeleton width="60%" height="28px" style={{ marginBottom: 16 }} />
        <Skeleton width="100%" height="44px" style={{ marginBottom: 12 }} />
        <Skeleton width="100%" height="44px" />
      </Box>
    </Flex>
  );
}
