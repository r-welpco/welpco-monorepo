import type { Meta, StoryObj } from '@storybook/react-vite';
import { RegisterForm } from '@welpco/ui';

const meta = {
  title: 'Platform/UserManagement/RegisterForm',
  component: RegisterForm,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
} satisfies Meta<typeof RegisterForm>;

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
    error: 'Email already exists. Try another.',
  },
};

