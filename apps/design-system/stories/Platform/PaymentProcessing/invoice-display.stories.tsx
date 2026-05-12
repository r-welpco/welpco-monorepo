import type { Meta, StoryObj } from '@storybook/react-vite';
import { InvoiceDisplay } from '@welpco/ui';

const meta = {
  title: 'Platform/PaymentProcessing/InvoiceDisplay',
  component: InvoiceDisplay,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof InvoiceDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems = [
  { description: 'Moving service', quantity: 1, unitPrice: 150, total: 150 },
  { description: 'Furniture assembly', quantity: 2, unitPrice: 50, total: 100 },
];

export const Default: Story = {
  args: {
    invoiceNumber: 'INV-2025-001',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    status: 'pending',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerAddress: '123 Main St, City, State 12345',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
  },
};

export const Paid: Story = {
  args: {
    invoiceNumber: 'INV-2025-002',
    date: '2025-01-10',
    status: 'paid',
    customerName: 'Jane Smith',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    discount: 10,
    total: 265,
  },
};

export const Overdue: Story = {
  args: {
    invoiceNumber: 'INV-2025-003',
    date: '2025-01-01',
    dueDate: '2025-01-15',
    status: 'overdue',
    customerName: 'Bob Johnson',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
    notes: 'Payment is overdue. Please contact support.',
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: 'mobile' } },
  args: {
    invoiceNumber: 'INV-2025-001',
    date: '2025-01-15',
    dueDate: '2025-02-15',
    status: 'pending',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerAddress: '123 Main St, City, State 12345',
    items: sampleItems,
    subtotal: 250,
    tax: 25,
    total: 275,
  },
};

