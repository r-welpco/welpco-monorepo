import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '@welpco/ui/icon-button';
import { Flex, Text, Box } from '@radix-ui/themes';
import {
  MagnifyingGlassIcon,
  Cross2Icon,
  PlusIcon,
  DotsHorizontalIcon,
  HeartIcon,
} from '@radix-ui/react-icons';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
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
      options: ['gray', 'blue', 'green', 'red', 'amber'],
    },
    size: {
      control: 'select',
      options: ['1', '2', '3', '4'],
    },
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <MagnifyingGlassIcon />,
    'aria-label': 'Search',
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconButton variant="solid" aria-label="Add item (solid)">
        <PlusIcon />
      </IconButton>
      <IconButton variant="soft" aria-label="Add item (soft)">
        <PlusIcon />
      </IconButton>
      <IconButton variant="outline" aria-label="Add item (outline)">
        <PlusIcon />
      </IconButton>
      <IconButton variant="ghost" aria-label="Add item (ghost)">
        <PlusIcon />
      </IconButton>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconButton color="gray" aria-label="Favorite (gray)">
        <HeartIcon />
      </IconButton>
      <IconButton color="blue" aria-label="Favorite (blue)">
        <HeartIcon />
      </IconButton>
      <IconButton color="green" aria-label="Favorite (green)">
        <HeartIcon />
      </IconButton>
      <IconButton color="red" aria-label="Favorite (red)">
        <HeartIcon />
      </IconButton>
      <IconButton color="amber" aria-label="Favorite (amber)">
        <HeartIcon />
      </IconButton>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconButton size="1" aria-label="Add (size 1)">
        <PlusIcon />
      </IconButton>
      <IconButton size="2" aria-label="Add (size 2)">
        <PlusIcon />
      </IconButton>
      <IconButton size="3" aria-label="Add (size 3)">
        <PlusIcon />
      </IconButton>
      <IconButton size="4" aria-label="Add (size 4)">
        <PlusIcon />
      </IconButton>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="3" align="center">
      <IconButton disabled aria-label="Add (disabled)">
        <PlusIcon />
      </IconButton>
      <IconButton variant="outline" disabled aria-label="Close (disabled)">
        <Cross2Icon />
      </IconButton>
    </Flex>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Flex gap="2" align="center">
        <IconButton aria-label="Search">
          <MagnifyingGlassIcon />
        </IconButton>
        <Text size="2">Search</Text>
      </Flex>
      <Flex gap="2" align="center">
        <IconButton aria-label="Add">
          <PlusIcon />
        </IconButton>
        <Text size="2">Add</Text>
      </Flex>
      <Flex gap="2" align="center">
        <IconButton aria-label="Close">
          <Cross2Icon />
        </IconButton>
        <Text size="2">Close</Text>
      </Flex>
      <Flex gap="2" align="center">
        <IconButton aria-label="More options">
          <DotsHorizontalIcon />
        </IconButton>
        <Text size="2">More options</Text>
      </Flex>
    </Flex>
  ),
};

