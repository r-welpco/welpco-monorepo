import type { Meta, StoryObj } from '@storybook/react-vite';
import { LoginForm } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/LoginForm',
  component: LoginForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof LoginForm>;

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
    error: 'Invalid credentials. Please try again.',
  },
};

