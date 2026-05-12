import type { Meta, StoryObj } from '@storybook/react-vite';
import { PaymentMethodCard } from '@welpco/ui';
import { Flex } from '@radix-ui/themes';

const meta = {
  title: 'Platform/PaymentProcessing/PaymentMethodCard',
  component: PaymentMethodCard,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PaymentMethodCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    brand: 'Visa',
    last4: '4242',
    exp: '12/25',
    isDefault: false,
  },
};

export const DefaultCard: Story = {
  args: {
    brand: 'Mastercard',
    last4: '8888',
    exp: '06/26',
    isDefault: true,
  },
};

export const WithActions: Story = {
  args: {
    brand: 'American Express',
    last4: '0005',
    exp: '09/27',
    isDefault: false,
    onMakeDefault: () => console.log('Make default'),
    onRemove: () => console.log('Remove'),
  },
};

export const MultipleCards: Story = {
  render: () => (
    <Flex direction="column" gap="3" style={{ width: '400px' }}>
      <PaymentMethodCard brand="Visa" last4="4242" exp="12/25" isDefault />
      <PaymentMethodCard brand="Mastercard" last4="8888" exp="06/26" />
    </Flex>
  ),
};

