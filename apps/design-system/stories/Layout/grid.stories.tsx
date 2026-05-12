import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from '@welpco/ui/grid';
import { Box, Text } from '@radix-ui/themes';

const meta = {
  title: 'Layout/Grid',
  component: Grid,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Grid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    columns: '3',
    gap: '3',
    children: Array.from({ length: 6 }, (_, i) => (
      <Box key={i} p="3" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
        <Text>Item {i + 1}</Text>
      </Box>
    )),
  },
};

export const ResponsiveColumns: Story = {
  render: () => (
    <Grid columns={{ initial: '1', sm: '2', md: '3', lg: '4' }} gap="3" style={{ width: '100%', maxWidth: '800px' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i} p="3" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>Item {i + 1}</Text>
        </Box>
      ))}
    </Grid>
  ),
};

export const FixedColumns: Story = {
  render: () => (
    <Grid columns="4" gap="3" style={{ width: '100%', maxWidth: '600px' }}>
      {Array.from({ length: 8 }, (_, i) => (
        <Box key={i} p="3" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>Item {i + 1}</Text>
        </Box>
      ))}
    </Grid>
  ),
};

export const GapSizes: Story = {
  render: () => (
    <Grid columns="3" gap="1" style={{ width: '100%', maxWidth: '400px', marginBottom: '16px' }}>
      {Array.from({ length: 3 }, (_, i) => (
        <Box key={i} p="2" style={{ backgroundColor: 'var(--blue-5)', borderRadius: 'var(--radius-2)' }}>
          <Text>Gap 1</Text>
        </Box>
      ))}
    </Grid>
  ),
};

