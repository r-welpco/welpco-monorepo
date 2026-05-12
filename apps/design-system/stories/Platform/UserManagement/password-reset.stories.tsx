import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordReset } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/PasswordReset',
  component: PasswordReset,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PasswordReset>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { loading: true },
};

export const WithError: Story = {
  args: {
    error: 'Reset link is invalid or expired.',
  },
};

