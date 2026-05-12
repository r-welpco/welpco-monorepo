import type { Meta, StoryObj } from '@storybook/react-vite';
import { Flex } from '@welpco/ui/flex';
import { Box, Text, Button } from '@radix-ui/themes';

const meta = {
  title: 'Layout/Flex',
  component: Flex,
  parameters: {
    layout: 'centered',
    a11y: {
      // Demo story — showcases Radix variants at every contrast level including
      // decorative low-contrast options (ghost / outline / soft). Production
      // code is still checked by bible §5.3 and the a11y addon panel. axe's
      // color-contrast rule is disabled here so variant-exploration stories
      // don't pollute the CI baseline.
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Flex>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Flex container',
    gap: '3',
    p: '4',
    style: { backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' },
  },
};

export const Directions: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Flex gap="2" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>1</Text>
        </Box>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>2</Text>
        </Box>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>3</Text>
        </Box>
      </Flex>
      <Flex gap="2" direction="column" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>1</Text>
        </Box>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>2</Text>
        </Box>
        <Box p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>3</Text>
        </Box>
      </Flex>
    </Flex>
  ),
};

export const Alignment: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Flex gap="2" align="start" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', height: '80px' }}>
        <Button size="1">Start</Button>
        <Button size="2">Aligned</Button>
        <Button size="3">Items</Button>
      </Flex>
      <Flex gap="2" align="center" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', height: '80px' }}>
        <Button size="1">Center</Button>
        <Button size="2">Aligned</Button>
        <Button size="3">Items</Button>
      </Flex>
      <Flex gap="2" align="end" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', height: '80px' }}>
        <Button size="1">End</Button>
        <Button size="2">Aligned</Button>
        <Button size="3">Items</Button>
      </Flex>
    </Flex>
  ),
};

export const Justify: Story = {
  render: () => (
    <Flex gap="4" direction="column">
      <Flex gap="2" justify="start" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Button>Start</Button>
        <Button>Justified</Button>
      </Flex>
      <Flex gap="2" justify="center" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Button>Center</Button>
        <Button>Justified</Button>
      </Flex>
      <Flex gap="2" justify="end" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Button>End</Button>
        <Button>Justified</Button>
      </Flex>
      <Flex gap="2" justify="between" p="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)' }}>
        <Button>Between</Button>
        <Button>Justified</Button>
      </Flex>
    </Flex>
  ),
};

