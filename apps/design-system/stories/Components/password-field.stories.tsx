import type { Meta, StoryObj } from "@storybook/react";
import { PasswordField } from "@welpco/ui/password-field";
import { Text } from "@welpco/ui/text";
import { Box } from "@welpco/ui/box";

const meta: Meta<typeof PasswordField> = {
  title: "Components/PasswordField",
  component: PasswordField,
  parameters: { layout: "centered" },
};

export default meta;
type Story = StoryObj<typeof PasswordField>;

export const Default: Story = {
  render: () => (
    <Box style={{ width: 320 }}>
      <Text as="label" size="2" weight="bold" htmlFor="demo-password" mb="2">
        Password
      </Text>
      <PasswordField
        id="demo-password"
        placeholder="Enter your password"
        autoComplete="current-password"
      />
    </Box>
  ),
};
