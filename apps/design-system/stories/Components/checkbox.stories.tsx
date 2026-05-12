import type { Meta, StoryObj } from '@storybook/react-vite';
import { Checkbox } from '@welpco/ui/checkbox';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Checkbox id="checkbox-default" />
        <Text>Accept terms and conditions</Text>
      </Flex>
    </Text>
  ),
};

export const Checked: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Checkbox id="checkbox-checked" defaultChecked />
        <Text>Email me weekly</Text>
      </Flex>
    </Text>
  ),
};

export const Unchecked: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Checkbox id="checkbox-unchecked" defaultChecked={false} />
        <Text>Send me marketing emails</Text>
      </Flex>
    </Text>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox id="checkbox-disabled-unchecked" disabled />
          <Text>Disabled option</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox id="checkbox-disabled-checked" disabled defaultChecked />
          <Text>Disabled (checked)</Text>
        </Flex>
      </Text>
    </Flex>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox />
          <Text>Accept terms and conditions</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox defaultChecked />
          <Text>Subscribe to newsletter</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Checkbox disabled />
          <Text>Disabled option</Text>
        </Flex>
      </Text>
    </Flex>
  ),
};

