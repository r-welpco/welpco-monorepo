import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from '@welpco/ui/skeleton';
import { Flex, Box } from '@radix-ui/themes';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    style: { width: '200px', height: '20px' },
  },
};

export const Variants: Story = {
  render: () => (
    <Flex gap="4" direction="column" style={{ width: '300px' }}>
      <Skeleton style={{ width: '100%', height: '20px' }} />
      <Skeleton style={{ width: '80%', height: '20px' }} />
      <Skeleton style={{ width: '60%', height: '20px' }} />
    </Flex>
  ),
};

export const CardSkeleton: Story = {
  render: () => (
    <Box p="4" style={{ width: '300px', border: '1px solid var(--gray-6)', borderRadius: 'var(--radius-3)' }}>
      <Flex direction="column" gap="3">
        <Skeleton style={{ width: '60px', height: '60px', borderRadius: '50%' }} />
        <Skeleton style={{ width: '100%', height: '16px' }} />
        <Skeleton style={{ width: '80%', height: '16px' }} />
        <Skeleton style={{ width: '100%', height: '100px' }} />
      </Flex>
    </Box>
  ),
};

