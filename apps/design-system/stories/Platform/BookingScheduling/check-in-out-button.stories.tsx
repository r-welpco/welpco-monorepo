import type { Meta, StoryObj } from '@storybook/react-vite';
import { CheckInOutButton } from '@welpco/ui';

const meta = {
  title: 'Platform/BookingScheduling/CheckInOutButton',
  component: CheckInOutButton,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof CheckInOutButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Confirmed: Story = {
  args: { status: 'accepted' },
};

export const InProgress: Story = {
  args: { status: 'in-progress' },
};

export const Completed: Story = {
  args: { status: 'completed' },
};

