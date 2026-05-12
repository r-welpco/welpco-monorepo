import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountVerification } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/AccountVerification',
  component: AccountVerification,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AccountVerification>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    email: 'user@example.com',
    onSubmit: (values) => console.log('submit', values),
    onResend: () => console.log('Resend code'),
  },
};

export const WithPhone: Story = {
  args: {
    phoneNumber: '+1 (555) 123-4567',
    onSubmit: (values) => console.log('submit', values),
    onResend: () => console.log('Resend code'),
  },
};

export const ErrorState: Story = {
  args: {
    email: 'user@example.com',
    error: 'Code expired. Request a new one.',
    onSubmit: (values) => console.log('submit', values),
    onResend: () => console.log('Resend code'),
  },
};

export const Loading: Story = {
  args: {
    email: 'user@example.com',
    loading: true,
    onSubmit: (values) => console.log('submit', values),
    onResend: () => console.log('Resend code'),
  },
};

