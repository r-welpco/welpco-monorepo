import type { Meta, StoryObj } from '@storybook/react-vite';
import { Strong } from '@welpco/ui/strong';
import { Text, Flex } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Strong',
  component: Strong,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Strong>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Bold text',
  },
};

export const InText: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '400px' }}>
      <Text>
        This is normal text with <Strong>bold emphasis</Strong> in the middle.
      </Text>
      <Text>
        You can use <Strong>Strong</Strong> to highlight important information.
      </Text>
      <Text size="3">
        Larger text with <Strong>bold words</Strong> for emphasis.
      </Text>
    </Flex>
  ),
};

export const Sizes: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Text size="1">
        Size 1: <Strong>Bold text</Strong>
      </Text>
      <Text size="2">
        Size 2: <Strong>Bold text</Strong>
      </Text>
      <Text size="3">
        Size 3: <Strong>Bold text</Strong>
      </Text>
      <Text size="4">
        Size 4: <Strong>Bold text</Strong>
      </Text>
    </Flex>
  ),
};

