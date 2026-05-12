import type { Meta, StoryObj } from '@storybook/react-vite';
import { Heading } from '@welpco/ui/heading';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Heading',
  component: Heading,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    },
    as: {
      control: 'select',
      options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'],
    },
  },
} satisfies Meta<typeof Heading>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Heading',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Heading size="1">Size 1 Heading</Heading>
      <Heading size="2">Size 2 Heading</Heading>
      <Heading size="3">Size 3 Heading</Heading>
      <Heading size="4">Size 4 Heading</Heading>
      <Heading size="5">Size 5 Heading</Heading>
      <Heading size="6">Size 6 Heading</Heading>
      <Heading size="7">Size 7 Heading</Heading>
      <Heading size="8">Size 8 Heading</Heading>
      <Heading size="9">Size 9 Heading</Heading>
    </Flex>
  ),
};

export const AsVariants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Heading as="h1" size="6">
        H1 Heading
      </Heading>
      <Heading as="h2" size="5">
        H2 Heading
      </Heading>
      <Heading as="h3" size="4">
        H3 Heading
      </Heading>
      <Heading as="h4" size="3">
        H4 Heading
      </Heading>
      <Heading as="h5" size="2">
        H5 Heading
      </Heading>
      <Heading as="h6" size="1">
        H6 Heading
      </Heading>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Heading>Default color</Heading>
      <Heading color="gray">Gray heading</Heading>
      <Heading color="blue">Blue heading</Heading>
      <Heading color="green">Green heading</Heading>
    </Flex>
  ),
};

export const Trimming: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '200px' }}>
      <Heading trim="start">
        Start trimmed heading with long text that wraps
      </Heading>
      <Heading trim="end">
        End trimmed heading with long text that wraps
      </Heading>
      <Heading trim="both">
        Both trimmed heading with long text that wraps
      </Heading>
      <Heading>No trimming (default)</Heading>
    </Flex>
  ),
};

