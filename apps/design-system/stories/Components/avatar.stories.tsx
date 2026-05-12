import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@welpco/ui/avatar';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
  },
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    fallback: 'JD',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Flex direction="column" align="center" gap="2">
        <Avatar size="1" fallback="JD" />
        <Text size="1">Size 1</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Avatar size="2" fallback="JD" />
        <Text size="1">Size 2</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Avatar size="3" fallback="JD" />
        <Text size="1">Size 3</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Avatar size="4" fallback="JD" />
        <Text size="1">Size 4</Text>
      </Flex>
      <Flex direction="column" align="center" gap="2">
        <Avatar size="5" fallback="JD" />
        <Text size="1">Size 5</Text>
      </Flex>
    </Flex>
  ),
};

export const WithImage: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Avatar
        src="https://images.unsplash.com/photo-1492633423870-43d1cd2775eb?&w=128&h=128&dpr=2&q=80"
        fallback="JD"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1511485977113-f34c92461ad9?&w=128&h=128&dpr=2&q=80"
        fallback="SM"
      />
      <Avatar
        src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?&w=128&h=128&dpr=2&q=80"
        fallback="MJ"
      />
    </Flex>
  ),
};

export const WithFallback: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Avatar fallback="JD" />
      <Avatar fallback="SM" />
      <Avatar fallback="MJ" />
      <Avatar fallback="AB" />
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" align="center">
      <Avatar fallback="JD" color="blue" />
      <Avatar fallback="SM" color="green" />
      <Avatar fallback="MJ" color="red" />
      <Avatar fallback="AB" color="amber" />
    </Flex>
  ),
};

