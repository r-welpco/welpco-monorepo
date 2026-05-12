import type { Meta, StoryObj } from '@storybook/react-vite';
import { Text } from '@welpco/ui/text';
import { Flex, Strong } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Text',
  component: Text,
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
    weight: {
      control: 'select',
      options: ['light', 'regular', 'medium', 'bold'],
    },
  },
} satisfies Meta<typeof Text>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Text content',
  },
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text size="1">Size 1 text</Text>
      <Text size="2">Size 2 text</Text>
      <Text size="3">Size 3 text</Text>
      <Text size="4">Size 4 text</Text>
      <Text size="5">Size 5 text</Text>
      <Text size="6">Size 6 text</Text>
      <Text size="7">Size 7 text</Text>
      <Text size="8">Size 8 text</Text>
      <Text size="9">Size 9 text</Text>
    </Flex>
  ),
};

export const Colors: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text>Default color</Text>
      <Text color="gray">Gray text</Text>
      <Text color="blue">Blue text</Text>
      <Text color="green">Green text</Text>
      <Text color="red">Red text</Text>
      <Text color="amber">Amber text</Text>
    </Flex>
  ),
};

export const Weights: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text weight="light">Light weight text</Text>
      <Text weight="regular">Regular weight text</Text>
      <Text weight="medium">Medium weight text</Text>
      <Text weight="bold">Bold weight text</Text>
    </Flex>
  ),
};

export const AsVariants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text as="p">Paragraph text</Text>
      <Text as="div">Div text</Text>
      <Text as="span">Span text</Text>
      <Text as="label">Label text</Text>
    </Flex>
  ),
};

export const Trimming: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '200px' }}>
      <Text trim="start">
        Start trimmed text with long content that wraps to multiple lines
      </Text>
      <Text trim="end">
        End trimmed text with long content that wraps to multiple lines
      </Text>
      <Text trim="both">
        Both trimmed text with long content that wraps to multiple lines
      </Text>
      <Text>No trimming (default)</Text>
    </Flex>
  ),
};

export const WithStrong: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '400px' }}>
      <Text>
        This is normal text with <Strong>bold emphasis</Strong> in the middle.
      </Text>
      <Text size="3">
        Larger text with <Strong>important words</Strong> highlighted.
      </Text>
    </Flex>
  ),
};

