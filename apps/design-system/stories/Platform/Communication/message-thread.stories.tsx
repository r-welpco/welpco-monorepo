import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageThread } from '@welpco/ui';

const meta = {
  title: 'Platform/Communication/MessageThread',
  component: MessageThread,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MessageThread>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleMessages = [
  {
    message: 'Hello! How can I help you today?',
    sender: 'support',
    timestamp: '2:30 PM',
  },
  {
    message: 'Hi! I need help with my booking.',
    sender: 'user-123',
    timestamp: '2:31 PM',
  },
  {
    message: 'Sure, what do you need help with?',
    sender: 'support',
    timestamp: '2:32 PM',
  },
];

export const Default: Story = {
  args: {
    title: 'Support Chat',
    messages: sampleMessages,
    currentUserId: 'user-123',
    onSendMessage: (message) => console.log('Send', message),
  },
};

export const Empty: Story = {
  args: {
    title: 'Support Chat',
    messages: [],
    currentUserId: 'user-123',
  },
};

export const Loading: Story = {
  args: {
    title: 'Support Chat',
    messages: [],
    currentUserId: 'user-123',
    loading: true,
  },
};

/** Booking-scoped chat: messages have senderId and sender (display name); isOwn is derived from senderId. */
const bookingScopedMessages = [
  {
    id: 'msg-1',
    message: "Hi! I'm confirming our appointment for tomorrow.",
    sender: 'Alex Chen',
    senderId: '00000000-0000-0000-0000-000000000002',
    timestamp: '10:00 AM',
  },
  {
    id: 'msg-2',
    message: 'Perfect, looking forward to it!',
    sender: 'You',
    senderId: '00000000-0000-0000-0000-000000000001',
    timestamp: '10:05 AM',
  },
  {
    id: 'msg-3',
    message: "I'll be there at 2 PM as scheduled.",
    sender: 'Alex Chen',
    senderId: '00000000-0000-0000-0000-000000000002',
    timestamp: '10:10 AM',
  },
];

export const BookingScoped: Story = {
  args: {
    title: 'Chat — Booking #ABC12345',
    messages: bookingScopedMessages,
    currentUserId: '00000000-0000-0000-0000-000000000001',
    onSendMessage: (message) => console.log('Send', message),
  },
};

