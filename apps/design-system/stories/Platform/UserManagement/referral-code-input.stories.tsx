import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReferralCodeInput } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/ReferralCodeInput',
  component: ReferralCodeInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReferralCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onApply: (code) => console.log('apply', code),
  },
};

export const Success: Story = {
  args: {
    successMessage: 'Referral applied. 10% off your first booking!',
  },
};

export const Error: Story = {
  args: {
    error: 'Code not found or expired.',
  },
};

