import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentMethodForm } from '@welpco/ui';

const meta = {
  title: 'Platform/PaymentProcessing/PaymentMethodForm',
  component: PaymentMethodForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PaymentMethodForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (values) => console.log('submit', values),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const WithError: Story = {
  args: {
    error: 'Failed to add payment method. Please check your details.',
  },
};

