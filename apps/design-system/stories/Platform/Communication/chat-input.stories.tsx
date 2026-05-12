import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatInput } from '@welpco/ui';

const meta = {
  title: 'Platform/Communication/ChatInput',
  component: ChatInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSend: (message) => console.log('Send', message),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const WithAttachment: Story = {
  args: {
    onSend: (message) => console.log('Send', message),
    onAttachment: () => console.log('Attachment'),
  },
};

