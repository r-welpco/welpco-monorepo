import type { Meta, StoryObj } from '@storybook/react-vite';
import { Box } from '@welpco/ui/box';
import { Flex, Text, Heading } from '@radix-ui/themes';

const meta = {
  title: 'Layout/Box',
  component: Box,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Box>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Box content',
    p: '4',
    style: { backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' },
  },
};

export const Padding: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box p="1" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Text>Padding 1</Text>
      </Box>
      <Box p="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Text>Padding 2</Text>
      </Box>
      <Box p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Text>Padding 3</Text>
      </Box>
      <Box p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Text>Padding 4</Text>
      </Box>
    </Flex>
  ),
};

export const AsVariants: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Box as="section" p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Heading size="4">Section Box</Heading>
        <Text>This is a section element</Text>
      </Box>
      <Box as="article" p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Heading size="4">Article Box</Heading>
        <Text>This is an article element</Text>
      </Box>
      <Box as="div" p="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Heading size="4">Div Box</Heading>
        <Text>This is a div element</Text>
      </Box>
    </Flex>
  ),
};

