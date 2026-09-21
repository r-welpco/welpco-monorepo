import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentAuthorizationCard } from '@welpco/ui';

const meta = {
  title: 'Platform/PaymentProcessing/PaymentAuthorizationCard',
  component: PaymentAuthorizationCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PaymentAuthorizationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    amount: '$275.00',
    methodSummary: 'Visa •••• 4242',
    status: 'authorized',
    onApprove: () => console.log('Authorize'),
    onCancel: () => console.log('Cancel'),
  },
};

export const Loading: Story = {
  args: {
    amount: '$275.00',
    methodSummary: 'Visa •••• 4242',
    status: 'pending',
  },
};

export const WithError: Story = {
  args: {
    amount: '$275.00',
    methodSummary: 'Visa •••• 4242',
    status: 'failed',
  },
};

