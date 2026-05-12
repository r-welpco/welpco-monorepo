import type { Meta, StoryObj } from '@storybook/react-vite';
import { RecurringBookingForm } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/RecurringBookingForm',
  component: RecurringBookingForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RecurringBookingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const WithError: Story = {
  args: { error: 'End date must be after start date.' },
};

