import type { Meta, StoryObj } from '@storybook/react-vite';
import { AccountDeletionForm } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/AccountDeletionForm',
  component: AccountDeletionForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof AccountDeletionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onSubmit: (values) => console.log('submit', values),
    onCancel: () => console.log('Cancel'),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSubmit: (values) => console.log('submit', values),
  },
};

export const WithError: Story = {
  args: {
    error: 'Password is incorrect.',
    onSubmit: (values) => console.log('submit', values),
  },
};

