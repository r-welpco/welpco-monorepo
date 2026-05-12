import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingCalendar } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/BookingCalendar',
  component: BookingCalendar,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof BookingCalendar>;

export default meta;
type Story = StoryObj<typeof meta>;

const today = new Date();

export const Default: Story = {
  args: {
    events: [
      { date: today, status: 'accepted', label: 'Cleaning' },
      {
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1),
        status: 'pending',
        label: 'Tutoring',
      },
      {
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3),
        status: 'in-progress',
        label: 'Pet walk',
      },
    ],
  },
};

