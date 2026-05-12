import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '@welpco/ui/link';
import { Flex, Text, Box } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Link',
  component: Link,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
    color: {
      control: 'select',
      options: ['gray', 'blue', 'green', 'red', 'amber'],
    },
    underline: {
      control: 'select',
      options: ['auto', 'always', 'hover', 'none'],
    },
  },
} satisfies Meta<typeof Link>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Link',
    href: '#',
    onClick: (e) => e.preventDefault(),
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Link href="#" onClick={(e) => e.preventDefault()}>
        Default link
      </Link>
      <Link href="#" highContrast onClick={(e) => e.preventDefault()}>
        High contrast link
      </Link>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Link href="#" color="gray" onClick={(e) => e.preventDefault()}>
        Gray link
      </Link>
      <Link href="#" color="blue" onClick={(e) => e.preventDefault()}>
        Blue link
      </Link>
      <Link href="#" color="green" onClick={(e) => e.preventDefault()}>
        Green link
      </Link>
      <Link href="#" color="red" onClick={(e) => e.preventDefault()}>
        Red link
      </Link>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Link href="#" size="1" onClick={(e) => e.preventDefault()}>
        Size 1
      </Link>
      <Link href="#" size="2" onClick={(e) => e.preventDefault()}>
        Size 2
      </Link>
      <Link href="#" size="3" onClick={(e) => e.preventDefault()}>
        Size 3
      </Link>
      <Link href="#" size="4" onClick={(e) => e.preventDefault()}>
        Size 4
      </Link>
    </Flex>
  ),
};

export const Underline: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Link href="#" underline="always" onClick={(e) => e.preventDefault()}>
        Always underlined
      </Link>
      <Link href="#" underline="hover" onClick={(e) => e.preventDefault()}>
        Underline on hover
      </Link>
      <Link href="#" underline="none" onClick={(e) => e.preventDefault()}>
        Never underlined
      </Link>
      <Link href="#" underline="auto" onClick={(e) => e.preventDefault()}>
        Auto (default)
      </Link>
    </Flex>
  ),
};

export const HighContrast: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Link href="#" onClick={(e) => e.preventDefault()}>
        Normal link
      </Link>
      <Link href="#" highContrast onClick={(e) => e.preventDefault()}>
        High contrast link
      </Link>
    </Flex>
  ),
};

