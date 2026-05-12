import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentStatusBadge } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/PaymentProcessing/PaymentStatusBadge',
  component: PaymentStatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PaymentStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStatuses: Story = {
  render: () => (
    <Flex direction="column" gap="3">
      <PaymentStatusBadge status="pending" />
      <PaymentStatusBadge status="processing" />
      <PaymentStatusBadge status="completed" />
      <PaymentStatusBadge status="failed" />
      <PaymentStatusBadge status="refunded" />
    </Flex>
  ),
};

export const Pending: Story = {
  args: {
    status: 'pending',
  },
};

export const Completed: Story = {
  args: {
    status: 'completed',
  },
};

