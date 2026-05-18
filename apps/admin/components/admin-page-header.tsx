import { Flex, Heading, Text } from "@welpco/ui";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Flex justify="between" align="start" gap="4" wrap="wrap" mb="4">
      <Flex direction="column" gap="1">
        <Heading size="6" weight="bold">
          {title}
        </Heading>
        {description ? (
          <Text size="2" color="gray">
            {description}
          </Text>
        ) : null}
      </Flex>
      {actions ? <Flex gap="2" align="center">{actions}</Flex> : null}
    </Flex>
  );
}
