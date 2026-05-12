import type { Meta, StoryObj } from '@storybook/react-vite';
import { Section } from '@welpco/ui/section';
import { Text, Heading } from '@radix-ui/themes';

const meta = {
  title: 'Layout/Section',
  component: Section,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    size: '3',
    children: (
      <>
        <Heading size="6" mb="3">Section Title</Heading>
        <Text>This is content inside a section with default size.</Text>
      </>
    ),
    style: { backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' },
  },
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <Section size="1" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Heading size="5" mb="2">Size 1 Section</Heading>
        <Text>Content for size 1 section</Text>
      </Section>
      <Section size="2" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Heading size="5" mb="2">Size 2 Section</Heading>
        <Text>Content for size 2 section</Text>
      </Section>
      <Section size="3" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Heading size="5" mb="2">Size 3 Section</Heading>
        <Text>Content for size 3 section</Text>
      </Section>
      <Section size="4" style={{ backgroundColor: 'var(--gray-3)', borderRadius: 'var(--radius-3)', padding: 'var(--space-4)' }}>
        <Heading size="5" mb="2">Size 4 Section</Heading>
        <Text>Content for size 4 section</Text>
      </Section>
    </div>
  ),
};

