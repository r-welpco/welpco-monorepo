import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReminderCard } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/ReminderCard',
  component: ReminderCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReminderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Upcoming booking',
    scheduledFor: 'Today at 3:00 PM',
    location: '123 Market Street',
    notes: 'Parking available behind the building.',
  },
};

export const WithWarning: Story = {
  args: {
    ...Default.args,
    warning: 'Please confirm arrival. Customer requested shoe covers.',
  },
};

