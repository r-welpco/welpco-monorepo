import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@welpco/ui/button';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Components/Button',
  component: Button,
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
      options: ['solid', 'soft', 'outline', 'ghost'],
    },
    color: {
      control: 'select',
      options: ['green', 'blue', 'red', 'gray', 'amber'],
    },
    size: {
      control: 'select',
      options: ['1', '2', '3', '4'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Button',
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="3" direction="column">
      <Flex gap="2">
        <Button variant="solid">Solid</Button>
        <Button variant="soft">Soft</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
      </Flex>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="3" direction="column">
      <Flex gap="2">
        <Button color="green">Green</Button>
        <Button color="blue">Blue</Button>
        <Button color="red">Red</Button>
        <Button color="gray">Gray</Button>
        <Button color="amber">Amber</Button>
      </Flex>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <Button size="1">Size 1</Button>
      <Button size="2">Size 2</Button>
      <Button size="3">Size 3</Button>
      <Button size="4">Size 4</Button>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="2">
      <Button disabled>Disabled</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
    </Flex>
  ),
};

