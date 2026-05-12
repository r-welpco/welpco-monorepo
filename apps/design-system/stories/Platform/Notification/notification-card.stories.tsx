import type { Meta, StoryObj } from '@storybook/react-vite';
import { NotificationCard } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/Notification/NotificationCard',
  component: NotificationCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof NotificationCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unread: Story = {
  args: {
    id: 'notif-1',
    title: 'New booking confirmed',
    message: 'Your booking for Moving Service has been confirmed.',
    type: 'booking',
    timestamp: '2 hours ago',
    isRead: false,
    actionLabel: 'View booking',
    onAction: () => console.log('Action'),
  },
};

export const Read: Story = {
  args: {
    id: 'notif-2',
    title: 'Payment received',
    message: 'Your payment of $275.00 has been processed.',
    type: 'payment',
    timestamp: '1 day ago',
    isRead: true,
  },
};

export const WithAction: Story = {
  args: {
    id: 'notif-3',
    title: 'New message',
    message: 'You have a new message from John Doe.',
    type: 'message',
    timestamp: '3 hours ago',
    isRead: false,
    actionLabel: 'Open chat',
    onAction: () => console.log('Open chat'),
    onMarkRead: () => console.log('Mark read'),
  },
};

export const AllTypes: Story = {
  render: () => (
    <Flex direction="column" gap="2" style={{ width: '400px' }}>
      <NotificationCard
        id="1"
        title="Info notification"
        message="This is an info message."
        type="info"
        timestamp="1 hour ago"
      />
      <NotificationCard
        id="2"
        title="Success notification"
        message="Operation completed successfully."
        type="success"
        timestamp="2 hours ago"
      />
      <NotificationCard
        id="3"
        title="Warning notification"
        message="Please update your profile."
        type="warning"
        timestamp="3 hours ago"
      />
    </Flex>
  ),
};

