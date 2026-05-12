import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountStatusDisplay } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/AccountStatusDisplay',
  component: AccountStatusDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AccountStatusDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pending: Story = {
  args: {
    status: 'pending',
    emailVerified: false,
    onVerifyEmail: () => console.log('Verify email'),
  },
};

export const Active: Story = {
  args: {
    status: 'active',
    emailVerified: true,
    backgroundCheckStatus: 'completed',
  },
};

export const Suspended: Story = {
  args: {
    status: 'suspended',
    emailVerified: true,
    onContactSupport: () => console.log('Contact support'),
  },
};

export const Deactivated: Story = {
  args: {
    status: 'deactivated',
    emailVerified: true,
    onReactivate: () => console.log('Reactivate'),
  },
};

export const WelperPending: Story = {
  args: {
    status: 'pending',
    emailVerified: false,
    backgroundCheckStatus: 'pending',
    onVerifyEmail: () => console.log('Verify email'),
  },
};

