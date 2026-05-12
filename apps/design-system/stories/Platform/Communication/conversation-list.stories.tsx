import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConversationList } from '@welpco/ui';

const meta = {
  title: 'Platform/Communication/ConversationList',
  component: ConversationList,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ConversationList>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleConversations = [
  {
    id: 'conv-1',
    name: 'John Doe',
    lastMessage: 'Thanks for your help!',
    timestamp: '2 hours ago',
    unreadCount: 2,
    isOnline: true,
  },
  {
    id: 'conv-2',
    name: 'Jane Smith',
    lastMessage: 'Can we reschedule?',
    timestamp: '1 day ago',
    isOnline: false,
  },
];

export const Default: Story = {
  args: {
    conversations: sampleConversations,
    onSelect: (id) => console.log('Select', id),
  },
};

export const WithSelection: Story = {
  args: {
    conversations: sampleConversations,
    selectedId: 'conv-1',
    onSelect: (id) => console.log('Select', id),
  },
};

export const Empty: Story = {
  args: {
    conversations: [],
  },
};

export const Loading: Story = {
  args: {
    conversations: [],
    loading: true,
  },
};

/** Booking-scoped: each item id is a booking id, name is booking summary (e.g. for messages page). */
const bookingConversations = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001',
    name: 'Deep clean — Mar 15',
    lastMessage: "I'll be there at 2 PM.",
    timestamp: '2 hours ago',
    unreadCount: 1,
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002',
    name: 'Dog walk — Mar 16',
    lastMessage: 'Thank you for booking with me!',
    timestamp: '1 day ago',
  },
];

export const BookingConversations: Story = {
  args: {
    conversations: bookingConversations,
    selectedId: '550e8400-e29b-41d4-a716-446655440001',
    onSelect: (id) => console.log('Select booking chat', id),
  },
};

