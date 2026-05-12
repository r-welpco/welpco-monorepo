import type { Meta, StoryObj } from '@storybook/react-vite';
import { ScrollArea } from '@welpco/ui/scroll-area';
import { Text, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/ScrollArea',
  component: ScrollArea,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ScrollArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ScrollArea
      tabIndex={0}
      aria-label="Item list"
      style={{ width: '300px', height: '200px' }}
    >
      <Box p="4">
        {Array.from({ length: 20 }, (_, i) => (
          <Text key={i} as="div" mb="2">
            Item {i + 1}
          </Text>
        ))}
      </Box>
    </ScrollArea>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ScrollArea
      tabIndex={0}
      aria-label="Long scrollable content"
      style={{ width: '400px', height: '300px' }}
    >
      <Box p="4">
        <Text as="div" mb="4" size="4" weight="bold">Long Content</Text>
        {Array.from({ length: 50 }, (_, i) => (
          <Text key={i} as="div" mb="2">
            This is line {i + 1} of a long scrollable content area. The scroll area will show a scrollbar when content overflows.
          </Text>
        ))}
      </Box>
    </ScrollArea>
  ),
};
