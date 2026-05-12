import type { Meta, StoryObj } from '@storybook/react-vite';
import { SupportTicketCard } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/DisputeResolution/SupportTicketCard',
  component: SupportTicketCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof SupportTicketCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    ticketId: 'TKT-001',
    subject: 'Payment issue with booking',
    status: 'open',
    createdAt: '2025-01-15',
    priority: 'high',
    onView: () => console.log('View ticket'),
  },
};

export const InReview: Story = {
  args: {
    ticketId: 'TKT-002',
    subject: 'Service quality complaint',
    status: 'in-review',
    createdAt: '2025-01-14',
    lastUpdated: '2025-01-15',
    priority: 'medium',
  },
};

export const Resolved: Story = {
  args: {
    ticketId: 'TKT-003',
    subject: 'Booking cancellation request',
    status: 'resolved',
    createdAt: '2025-01-10',
    lastUpdated: '2025-01-12',
    priority: 'low',
  },
};

export const MultipleTickets: Story = {
  render: () => (
    <Flex direction="column" gap="3" style={{ width: '500px' }}>
      <SupportTicketCard
        ticketId="TKT-001"
        subject="Payment issue"
        status="open"
        createdAt="2025-01-15"
        priority="high"
      />
      <SupportTicketCard
        ticketId="TKT-002"
        subject="Service complaint"
        status="in-review"
        createdAt="2025-01-14"
        priority="medium"
      />
    </Flex>
  ),
};

