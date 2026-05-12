import type { Meta, StoryObj } from '@storybook/react-vite';
import { PasswordChangeForm } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/PasswordChangeForm',
  component: PasswordChangeForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof PasswordChangeForm>;

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
    onSubmit: (values) => console.log('submit', values),
  },
};

export const WithError: Story = {
  args: {
    error: 'Current password is incorrect.',
    onSubmit: (values) => console.log('submit', values),
  },
};

