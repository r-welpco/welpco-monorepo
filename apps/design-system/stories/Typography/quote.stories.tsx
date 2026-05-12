import type { Meta, StoryObj } from '@storybook/react-vite';
import { Quote } from '@welpco/ui/quote';
import { Flex, Text } from '@radix-ui/themes';

const meta = {
  title: 'Typography/Quote',
  component: Quote,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Quote>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'This is a quote with important information.',
  },
};

export const WithAuthor: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Quote>
        The best way to predict the future is to invent it.
        <Text as="div" size="2" color="gray" mt="2">
          — Alan Kay
        </Text>
      </Quote>
    </Flex>
  ),
};

export const LongQuote: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ maxWidth: '500px' }}>
      <Quote>
        Design is not just what it looks like and feels like. Design is how it works. The details are not the details. They make the design.
      </Quote>
    </Flex>
  ),
};

