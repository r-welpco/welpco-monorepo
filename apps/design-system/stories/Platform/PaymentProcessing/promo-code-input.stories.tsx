import type { Meta, StoryObj } from '@storybook/react-vite';
import { PromoCodeInput } from '@welpco/ui';

const meta = {
  title: 'Platform/PaymentProcessing/PromoCodeInput',
  component: PromoCodeInput,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PromoCodeInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onApply: (code) => console.log('Apply code', code),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Invalid promo code. Please try again.',
  },
};

export const WithSuccess: Story = {
  args: {
    successMessage: 'Promo code applied! 10% discount added.',
  },
};

