import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingCard } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/BookingCard',
  component: BookingCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof BookingCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: {
    serviceTitle: 'Premium home cleaning',
    customerName: 'Lisa Frank',
    welperName: 'Alex Carter',
    scheduledFor: 'Jan 18, 2026 — 2:00 PM',
    location: '123 Market Street, San Francisco',
    status: 'accepted',
    totalAmount: '$190',
  },
};

export const InProgress: Story = {
  args: {
    ...Confirmed.args,
    status: 'in-progress',
  },
};

export const Completed: Story = {
  args: {
    ...Confirmed.args,
    status: 'completed',
  },
};

