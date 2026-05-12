import type { Meta, StoryObj } from '@storybook/react-vite';
import { Container } from '@welpco/ui/container';
import { Text, Heading } from '@radix-ui/themes';

const meta = {
  title: 'Layout/Container',
  component: Container,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Container>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: '4',
    children: (
      <>
        <Heading size="6" mb="3">Container Content</Heading>
        <Text>This is content inside a container with default size.</Text>
      </>
    ),
    style: { backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <Container size="1" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Text>Size 1 container</Text>
      </Container>
      <Container size="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Text>Size 2 container</Text>
      </Container>
      <Container size="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Text>Size 3 container</Text>
      </Container>
      <Container size="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Text>Size 4 container</Text>
      </Container>
    </div>
  ),
};

