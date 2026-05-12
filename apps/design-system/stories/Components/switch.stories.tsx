import type { Meta, StoryObj } from '@storybook/react-vite';
import { Switch } from '@welpco/ui/switch';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Switch id="switch-default" />
        <Text>Enable notifications</Text>
      </Flex>
    </Text>
  ),
};

export const Checked: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Switch id="switch-checked" defaultChecked />
        <Text>Auto-save enabled</Text>
      </Flex>
    </Text>
  ),
};

export const Unchecked: Story = {
  render: () => (
    <Text as="label" size="2">
      <Flex gap="2" align="center">
        <Switch id="switch-unchecked" defaultChecked={false} />
        <Text>Dark mode</Text>
      </Flex>
    </Text>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch id="switch-disabled" disabled />
          <Text>Disabled option</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch id="switch-disabled-checked" disabled defaultChecked />
          <Text>Disabled (enabled)</Text>
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
          <Switch />
          <Text>Enable notifications</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch defaultChecked />
          <Text>Auto-save enabled</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch disabled />
          <Text>Disabled option</Text>
        </Flex>
      </Text>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column" align="center">
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch id="switch-size-1" size="1" />
          <Text size="1">Size 1</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch id="switch-size-2" size="2" />
          <Text size="1">Size 2</Text>
        </Flex>
      </Text>
      <Text as="label" size="2">
        <Flex gap="2" align="center">
          <Switch id="switch-size-3" size="3" />
          <Text size="1">Size 3</Text>
        </Flex>
      </Text>
    </Flex>
  ),
};

