import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckboxGroup } from '@welpco/ui/checkbox-group';
import { Checkbox } from '@welpco/ui/checkbox';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckboxGroup.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <CheckboxGroup.Root>
      <Flex direction="column" gap="2">
        <Text as="label" size="2">
          <Checkbox defaultChecked /> Option 1
        </Text>
        <Text as="label" size="2">
          <Checkbox /> Option 2
        </Text>
        <Text as="label" size="2">
          <Checkbox /> Option 3
        </Text>
      </Flex>
    </CheckboxGroup.Root>
  ),
};

export const WithLabels: Story = {
  render: () => (
    <CheckboxGroup.Root>
      <Flex direction="column" gap="3">
        <Text as="label" size="2">
          <Checkbox defaultChecked /> Email notifications
        </Text>
        <Text as="label" size="2">
          <Checkbox defaultChecked /> SMS notifications
        </Text>
        <Text as="label" size="2">
          <Checkbox /> Push notifications
        </Text>
        <Text as="label" size="2">
          <Checkbox /> Marketing emails
        </Text>
      </Flex>
    </CheckboxGroup.Root>
  ),
};

