import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolutionCard } from '@welpco/ui';

const meta = {
  title: 'Platform/DisputeResolution/ResolutionCard',
  component: ResolutionCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ResolutionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Resolved: Story = {
  args: {
    resolutionId: 'RES-001',
    status: 'resolved',
    resolution: 'We have processed a full refund of $275.00 to your original payment method.',
    resolvedBy: 'Support Team',
    resolvedAt: '2025-01-15',
    refundAmount: 275.00,
    notes: 'Refund will appear in your account within 5-7 business days.',
  },
};

export const Rejected: Story = {
  args: {
    resolutionId: 'RES-002',
    status: 'rejected',
    resolution: 'After review, we found that the service was completed as agreed. No refund will be issued.',
    resolvedBy: 'Support Team',
    resolvedAt: '2025-01-14',
    notes: 'If you have additional concerns, please contact support.',
  },
};

export const Partial: Story = {
  args: {
    resolutionId: 'RES-003',
    status: 'partial',
    resolution: 'We have processed a partial refund of $100.00 due to the service delay.',
    resolvedBy: 'Support Team',
    resolvedAt: '2025-01-13',
    refundAmount: 100.00,
  },
};

