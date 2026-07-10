import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextField } from '@welpco/ui/text-field';
import { Flex, Text, Box } from '@radix-ui/themes';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

const meta = {
  title: 'Components/TextField',
  component: TextField.Root,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3'],
    },
    variant: {
      control: 'select',
      options: ['classic', 'surface', 'soft'],
    },
  },
} satisfies Meta<typeof TextField.Root>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 1
        </Text>
        <TextField.Root size="1" placeholder="Size 1" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 2
        </Text>
        <TextField.Root size="2" placeholder="Size 2" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Size 3
        </Text>
        <TextField.Root size="3" placeholder="Size 3" />
      </Box>
    </Flex>
  ),
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Classic
        </Text>
        <TextField.Root variant="classic" placeholder="Classic variant" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Surface
        </Text>
        <TextField.Root variant="surface" placeholder="Surface variant" />
      </Box>
      <Box>
        <Text size="2" weight="bold" mb="2" as="div">
          Soft
        </Text>
        <TextField.Root variant="soft" placeholder="Soft variant" />
      </Box>
    </Flex>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <TextField.Root placeholder="Search...">
        <TextField.Slot>
          <MagnifyingGlassIcon height="16" width="16" />
        </TextField.Slot>
      </TextField.Root>
    </Flex>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <TextField.Root placeholder="Disabled field" disabled />
    </Flex>
  ),
};

export const WithLabel: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Box>
        <Text as="label" size="2" weight="medium" htmlFor="text-field-email" mb="1" style={{ display: 'block' }}>
          Email address
        </Text>
        <TextField.Root id="text-field-email" placeholder="Enter your email" type="email" />
      </Box>
      <Box>
        <Text as="label" size="2" weight="medium" htmlFor="text-field-password" mb="1" style={{ display: 'block' }}>
          Password
        </Text>
        <TextField.Root id="text-field-password" placeholder="Enter your password" type="password" />
      </Box>
    </Flex>
  ),
};

