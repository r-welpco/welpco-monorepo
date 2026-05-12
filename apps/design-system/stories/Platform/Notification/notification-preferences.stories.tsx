import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationPreferences } from '@welpco/ui';

const meta = {
  title: 'Platform/Notification/NotificationPreferences',
  component: NotificationPreferences,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationPreferences>;

export default meta;
type Story = StoryObj<typeof meta>;

const samplePreferences = [
  {
    id: 'email-booking',
    label: 'Booking confirmations',
    description: 'Get notified when your bookings are confirmed',
    enabled: true,
    category: 'email' as const,
  },
  {
    id: 'email-payment',
    label: 'Payment receipts',
    description: 'Receive receipts for all payments',
    enabled: true,
    category: 'email' as const,
  },
  {
    id: 'push-messages',
    label: 'New messages',
    description: 'Get push notifications for new messages',
    enabled: false,
    category: 'push' as const,
  },
  {
    id: 'sms-urgent',
    label: 'Urgent updates',
    description: 'Receive SMS for urgent booking changes',
    enabled: false,
    category: 'sms' as const,
  },
];

export const Default: Story = {
  args: {
    preferences: samplePreferences,
    onPreferenceChange: (id, enabled) => console.log('Change', id, enabled),
    onSave: () => console.log('Save'),
  },
};

export const Loading: Story = {
  args: {
    preferences: samplePreferences,
    loading: true,
  },
};

