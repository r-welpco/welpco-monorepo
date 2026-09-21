import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@welpco/ui/button';
import { expect, within } from 'storybook/test';
import { SEMANTIC_COLOR } from '@welpco/ui/tokens';
import { Flex, Theme } from '@radix-ui/themes';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
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
        <Button color="green" highContrast>Green</Button>
        <Button color="blue" highContrast>Blue</Button>
        <Button color="red" highContrast>Red</Button>
        <Button color="gray" highContrast>Gray</Button>
        <Button color="amber" highContrast>Amber</Button>
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


/** Explicit low-contrast overrides are shown disabled, not as recommended CTAs. */
export const ContrastCompatibility: Story = {
  render: () => <Theme accentColor={SEMANTIC_COLOR.info}>
    <Flex gap="3" wrap="wrap">
      <Button color={SEMANTIC_COLOR.primary}>Explicit primary</Button>
      <Button disabled>Inherited info</Button>
      <Button color={SEMANTIC_COLOR.primary} highContrast={false} disabled>Explicit override</Button>
      <Button color={SEMANTIC_COLOR.primary} variant="soft" disabled>Soft variant</Button>
      <Button color={SEMANTIC_COLOR.primary} asChild><a href="#fixture">Primary link</a></Button>
    </Flex>
  </Theme>,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole('button', { name: 'Explicit primary' })).toHaveClass('rt-high-contrast');
    for (const name of ['Inherited info', 'Explicit override', 'Soft variant']) {
      await expect(canvas.getByRole('button', { name })).not.toHaveClass('rt-high-contrast');
    }
    await expect(canvas.getByRole('link', { name: 'Primary link' })).toHaveClass('rt-high-contrast');
    await expect(canvas.getByRole('link', { name: 'Primary link' })).toHaveAttribute('href', '#fixture');
  },
};
