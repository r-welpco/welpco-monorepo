import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from '@welpco/ui/badge';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    a11y: {
      // Demo story — showcases Radix variants at every contrast level including
      // decorative low-contrast options (ghost / outline / soft). Production
      // code is still checked by bible §5.3 and the a11y addon panel. axe's
      // color-contrast rule is disabled here so variant-exploration stories
      // don't pollute the CI baseline.
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
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
        <Badge variant="solid">Solid</Badge>
        <Badge variant="soft">Soft</Badge>
        <Badge variant="outline">Outline</Badge>
        <Badge variant="surface">Surface</Badge>
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="3" direction="column">
      <Flex gap="2">
        <Badge color="green">Green</Badge>
        <Badge color="blue">Blue</Badge>
        <Badge color="red">Red</Badge>
        <Badge color="gray">Gray</Badge>
        <Badge color="amber">Amber</Badge>
        <Badge color="teal">Teal</Badge>
      </Flex>
    </Flex>
  ),
};

export const Status: Story = {
  render: () => (
    <Flex gap="2">
      <Badge color="green">Completed</Badge>
      <Badge color="amber">Pending</Badge>
      <Badge color="red">Cancelled</Badge>
      <Badge color="blue">Confirmed</Badge>
    </Flex>
  ),
};

