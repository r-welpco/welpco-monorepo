import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingStatusBadge } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/BookingStatusBadge',
  component: BookingStatusBadge,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof BookingStatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = { args: { status: 'pending' } };
export const Accepted: Story = { args: { status: 'accepted' } };
export const InProgress: Story = { args: { status: 'in-progress' } };
export const Completed: Story = { args: { status: 'completed' } };
export const Cancelled: Story = { args: { status: 'cancelled' } };

