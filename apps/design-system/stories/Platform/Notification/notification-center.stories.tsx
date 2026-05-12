import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationCenter } from '@welpco/ui';

const meta = {
  title: 'Platform/Notification/NotificationCenter',
  component: NotificationCenter,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationCenter>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleNotifications = [
  {
    id: 'notif-1',
    title: 'New booking confirmed',
    message: 'Your booking has been confirmed.',
    type: 'booking' as const,
    timestamp: '2 hours ago',
    isRead: false,
  },
  {
    id: 'notif-2',
    title: 'Payment received',
    message: 'Your payment has been processed.',
    type: 'payment' as const,
    timestamp: '1 day ago',
    isRead: true,
  },
  {
    id: 'notif-3',
    title: 'New message',
    message: 'You have a new message.',
    type: 'message' as const,
    timestamp: '3 hours ago',
    isRead: false,
  },
];

export const Default: Story = {
  args: {
    notifications: sampleNotifications,
    unreadCount: 2,
    onMarkAllRead: () => console.log('Mark all read'),
    onNotificationAction: (id) => console.log('Action', id),
    onMarkRead: (id) => console.log('Mark read', id),
  },
};

export const Empty: Story = {
  args: {
    notifications: [],
    unreadCount: 0,
  },
};

export const Loading: Story = {
  args: {
    notifications: [],
    loading: true,
  },
};

export const AllRead: Story = {
  args: {
    notifications: sampleNotifications.map((n) => ({ ...n, isRead: true })),
    unreadCount: 0,
  },
};

