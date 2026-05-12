import type { Meta, StoryObj } from '@storybook/react-vite';
import { BookingForm } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/BookingForm',
  component: BookingForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof BookingForm>;

export default meta;
type Story = StoryObj<typeof meta>;

const services = [
  { id: 'cleaning', label: 'Home cleaning' },
  { id: 'pet', label: 'Pet walking' },
  { id: 'tutoring', label: 'Math tutoring' },
];

export const Default: Story = {
  args: { services },
};

export const Loading: Story = {
  args: { services, loading: true },
};

export const WithError: Story = {
  args: { services, error: 'Please fill required fields.' },
};

