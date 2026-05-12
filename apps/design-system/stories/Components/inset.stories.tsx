import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inset } from '@welpco/ui/inset';
import { Card, Text, Flex, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/Inset',
  component: Inset,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    clip: {
      control: 'select',
      options: ['border-box', 'padding-box'],
    },
    side: {
      control: 'select',
      options: ['all', 'x', 'y', 'top', 'right', 'bottom', 'left'],
    },
  },
} satisfies Meta<typeof Inset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card size="3" style={{ width: '300px' }}>
      <Inset>
        <Box p="4" style={{ backgroundColor: 'var(--gray-3)' }}>
          <Text>Content with inset</Text>
        </Box>
      </Inset>
    </Card>
  ),
};

export const ClipVariants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Card size="3" style={{ width: '300px' }}>
        <Text size="2" weight="bold" mb="2" as="div">
          Border Box (default)
        </Text>
        <Inset clip="border-box">
          <Box p="4" style={{ backgroundColor: 'var(--gray-3)' }}>
            <Text>Content clipped to border</Text>
          </Box>
        </Inset>
      </Card>
      <Card size="3" style={{ width: '300px' }}>
        <Text size="2" weight="bold" mb="2" as="div">
          Padding Box
        </Text>
        <Inset clip="padding-box">
          <Box p="4" style={{ backgroundColor: 'var(--gray-3)' }}>
            <Text>Content clipped to padding</Text>
          </Box>
        </Inset>
      </Card>
    </Flex>
  ),
};

export const InCard: Story = {
  render: () => (
    <Card size="3" style={{ width: '400px' }}>
      <Flex direction="column" gap="4">
        <Box>
          <Text size="4" weight="bold">Card Title</Text>
          <Text size="2" color="gray">Card description</Text>
        </Box>
        <Inset>
          <Box p="4" style={{ backgroundColor: 'var(--gray-2)' }}>
            <Text>This content is inset within the card</Text>
          </Box>
        </Inset>
        <Text size="2">More content below</Text>
      </Flex>
    </Card>
  ),
};

