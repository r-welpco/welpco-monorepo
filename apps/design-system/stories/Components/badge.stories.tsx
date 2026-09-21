import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@welpco/ui/badge';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'soft', 'outline', 'surface'],
    },
    color: {
      control: 'select',
      options: ['green', 'blue', 'red', 'gray', 'amber', 'teal'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="3" direction="column">
      <Flex gap="2">
        <Badge highContrast variant="solid">Solid</Badge>
        <Badge highContrast variant="soft">Soft</Badge>
        <Badge highContrast variant="outline">Outline</Badge>
        <Badge highContrast variant="surface">Surface</Badge>
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="3" direction="column">
      <Flex gap="2">
        <Badge highContrast color="green">Green</Badge>
        <Badge highContrast color="blue">Blue</Badge>
        <Badge highContrast color="red">Red</Badge>
        <Badge highContrast color="gray">Gray</Badge>
        <Badge highContrast color="amber">Amber</Badge>
        <Badge highContrast color="teal">Teal</Badge>
      </Flex>
    </Flex>
  ),
};

export const Status: Story = {
  render: () => (
    <Flex gap="2">
      <Badge highContrast color="green">Completed</Badge>
      <Badge highContrast color="amber">Pending</Badge>
      <Badge highContrast color="red">Cancelled</Badge>
      <Badge highContrast color="blue">Confirmed</Badge>
    </Flex>
  ),
};

