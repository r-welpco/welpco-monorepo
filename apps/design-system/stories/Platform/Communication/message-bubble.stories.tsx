import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageBubble } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/Communication/MessageBubble',
  component: MessageBubble,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OwnMessage: Story = {
  args: {
    message: 'Hello! How can I help you today?',
    sender: 'You',
    timestamp: '2:30 PM',
    isOwn: true,
    isRead: true,
  },
};

export const OtherMessage: Story = {
  args: {
    message: 'Hi! I need help with my booking.',
    sender: 'John Doe',
    timestamp: '2:31 PM',
    isOwn: false,
  },
};

export const Conversation: Story = {
  render: () => (
    <Flex direction="column" gap="3" style={{ width: '400px' }}>
      <MessageBubble
        message="Hello! How can I help you today?"
        sender="You"
        timestamp="2:30 PM"
        isOwn
        isRead
      />
      <MessageBubble
        message="Hi! I need help with my booking."
        sender="John Doe"
        timestamp="2:31 PM"
        isOwn={false}
      />
      <MessageBubble
        message="Sure, what do you need help with?"
        sender="You"
        timestamp="2:32 PM"
        isOwn
        isRead={false}
      />
    </Flex>
  ),
};

/** Booking-scoped chat: isOwn derived from senderId === currentUserId; sender is display name. */
export const WithSenderId: Story = {
  args: {
    id: 'msg-1',
    message: "I'll be there at 2 PM as scheduled.",
    sender: 'Alex Chen',
    senderId: '00000000-0000-0000-0000-000000000002',
    timestamp: '2:30 PM',
    isOwn: false,
  },
};

