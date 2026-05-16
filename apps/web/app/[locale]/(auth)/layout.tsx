import { Flex } from "@welpco/ui/flex";
import { Box } from "@welpco/ui/box";
import { LanguageSwitcher } from "@/components/features/marketing/shared/language-switcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box position="relative" style={{ minHeight: "100vh" }}>
      <Flex
        justify="end"
        p="4"
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          zIndex: 10,
        }}
      >
        <LanguageSwitcher />
      </Flex>
      {children}
    </Box>
  );
}
