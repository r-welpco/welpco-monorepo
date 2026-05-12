import type { Meta, StoryObj } from '@storybook/react-vite';
import { Em } from '@welpco/ui/em';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Em',
  component: Em,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Em>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Emphasized text',
  },
};

export const InText: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Text>
        This is normal text with <Em>emphasized content</Em> in the middle.
      </Text>
      <Text>
        You can use <Em>Em</Em> to add emphasis to important words.
      </Text>
      <Text size="3">
        Larger text with <Em>emphasized words</Em> for better readability.
      </Text>
    </Flex>
  ),
};

export const Multiple: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Text>
        This sentence has <Em>multiple</Em> instances of <Em>emphasis</Em> to highlight different <Em>important</Em> words.
      </Text>
    </Flex>
  ),
};

