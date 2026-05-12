import type { Meta, StoryObj } from '@storybook/react-vite';
import { ReceiptDisplay } from '@welpco/ui';

const meta = {
  title: 'Platform/PaymentProcessing/ReceiptDisplay',
  component: ReceiptDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof ReceiptDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  { description: 'Moving service', quantity: 1, unitPrice: 150, total: 150 },
  { description: 'Furniture assembly', quantity: 2, unitPrice: 50, total: 100 },
];

export const Default: Story = {
  args: {
    receiptNumber: 'RCP-2025-001',
    date: '2025-01-15 14:30',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'TXN-ABC123XYZ',
    customerName: 'John Doe',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
  },
};

export const WithDiscount: Story = {
  args: {
    receiptNumber: 'RCP-2025-002',
    date: '2025-01-15 14:30',
    paymentMethod: 'Mastercard •••• 8888',
    customerName: 'Jane Smith',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    discount: 20,
    total: 255,
  },
};

export const WithActions: Story = {
  args: {
    receiptNumber: 'RCP-2025-003',
    date: '2025-01-15 14:30',
    paymentMethod: 'PayPal',
    customerName: 'Bob Johnson',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
    onDownload: () => console.log('Download'),
    onPrint: () => console.log('Print'),
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  args: {
    receiptNumber: 'RCP-2025-001',
    date: '2025-01-15 14:30',
    paymentMethod: 'Visa •••• 4242',
    transactionId: 'TXN-ABC123XYZ',
    customerName: 'John Doe',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
    onDownload: () => console.log('Download'),
    onPrint: () => console.log('Print'),
  },
};

