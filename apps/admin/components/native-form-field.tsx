import { Flex, Text } from "@welpco/ui";

const nativeControlStyle: React.CSSProperties = {
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-2)",
  border: "1px solid var(--gray-a6)",
  background: "var(--color-surface)",
  color: "var(--gray-12)",
  font: "inherit",
  minWidth: 140,
};

export function NativeFormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Flex direction="column" gap="1">
      <Text as="label" size="2" weight="medium">
        {label}
      </Text>
      {children}
    </Flex>
  );
}

export function nativeSelectProps(): React.SelectHTMLAttributes<HTMLSelectElement> {
  return { style: nativeControlStyle };
}

export function nativeInputProps(): React.InputHTMLAttributes<HTMLInputElement> {
  return { style: { ...nativeControlStyle, minWidth: 220 } };
}
