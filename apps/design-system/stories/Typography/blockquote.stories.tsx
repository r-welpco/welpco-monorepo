import type { Meta, StoryObj } from '@storybook/react-vite';
import { Blockquote } from '@welpco/ui/blockquote';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Blockquote',
  component: Blockquote,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Blockquote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a blockquote with important information.',
  },
};

export const WithAuthor: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Blockquote>
        The only way to do great work is to love what you do.
        <Text as="div" size="2" color="gray" mt="2">
          — Steve Jobs
        </Text>
      </Blockquote>
    </Flex>
  ),
};

export const LongQuote: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Blockquote>
        Innovation distinguishes between a leader and a follower. The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.
      </Blockquote>
    </Flex>
  ),
};

